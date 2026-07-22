import { useEffect, useMemo, useState } from 'react';
import { Check, CircleCheck, DoorOpen, Dumbbell, Search, Waves } from 'lucide-react';
import { SERVICES } from '../config';
import { isMemberActive } from '../lib/domain';

const SERVICE_ICONS = { alberca: Waves, gimnasio: Dumbbell, sauna: DoorOpen };

export function AccessWorkflow({ members, initialMember, onCheckIn, onToast, onTicket, compact = false }) {
  const [query, setQuery] = useState(initialMember?.name ?? 'Mariana López');
  const [member, setMember] = useState(initialMember ?? members[0] ?? null);
  const [service, setService] = useState('alberca');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!initialMember) return;
    setMember(initialMember);
    setQuery(initialMember.name);
    const firstService = initialMember.services[0];
    if (firstService) setService(firstService);
  }, [initialMember]);

  const matches = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('es');
    if (!value || value === member?.name.toLocaleLowerCase('es')) return [];
    return members.filter((item) =>
      `${item.name} ${item.id} ${item.phone}`.toLocaleLowerCase('es').includes(value),
    ).slice(0, 4);
  }, [member, members, query]);

  const chooseMember = (nextMember) => {
    setMember(nextMember);
    setQuery(nextMember.name);
    if (!nextMember.services.includes(service)) setService(nextMember.services[0] ?? 'alberca');
  };

  const search = () => {
    if (matches[0]) chooseMember(matches[0]);
    else if (!member || !query.trim()) onToast('Escribe el nombre, teléfono o ID de un miembro.', 'error');
  };

  const register = async () => {
    setBusy(true);
    const result = await onCheckIn(member, service);
    setBusy(false);
    if (!result.ok) {
      onToast(result.message, 'error');
      return;
    }
    onTicket?.(result.session);
    onToast(`Entrada registrada. Locker ${result.session.locker ?? 'sin asignar'}.`, 'success');
  };

  return (
    <div className={`access-layout ${compact ? 'access-layout-compact' : ''}`}>
      <section className="access-form panel-frame">
        <h2>Registrar acceso</h2>
        <label className="field-label" htmlFor="member-query">ID, teléfono o nombre</label>
        <div className="member-search-control">
          <Search size={18} />
          <input
            id="member-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && search()}
            placeholder="Buscar miembro..."
          />
          {matches.length > 0 && (
            <div className="inline-results">
              {matches.map((item) => (
                <button key={item.id} onClick={() => chooseMember(item)}>
                  <span>{item.name}</span><small>{item.id}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="field-label">Servicio</span>
        <div className="service-segments" role="group" aria-label="Servicio">
          {Object.entries(SERVICES).map(([id, item]) => {
            const Icon = SERVICE_ICONS[id];
            return (
              <button key={id} className={service === id ? 'selected' : ''} onClick={() => setService(id)}>
                <Icon size={18} strokeWidth={1.8} /> {item.label}
              </button>
            );
          })}
        </div>
        <button className="primary-button full-button" onClick={search}><Search size={18} /> Buscar miembro</button>
      </section>

      <section className="member-result panel-frame" aria-live="polite">
        {member ? (
          <>
            <div className="member-result-head">
              <span className="member-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <div><h2>{member.name}</h2><p>ID: {member.id}</p></div>
              <span className={`status-tag ${isMemberActive(member) ? 'status-success' : 'status-danger'}`}>
                {isMemberActive(member) ? <CircleCheck size={15} /> : null}
                {isMemberActive(member) ? 'Membresía vigente' : 'Membresía vencida'}
              </span>
            </div>
            <div className="member-result-details">
              <div><span>Plan</span><strong>{member.plan}</strong><span>Vencimiento</span><strong>{new Date(`${member.expiry}T12:00:00`).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
              <div><span>Servicios incluidos</span><div className="included-services">{member.services.map((id) => { const Icon = SERVICE_ICONS[id]; return <span key={id}><Icon size={19} /><small>{SERVICES[id].label}</small></span>; })}</div></div>
            </div>
            <button className="primary-button full-button" disabled={busy} onClick={register}>
              {busy ? 'Guardando...' : <><Check size={18} /> Registrar entrada</>}
            </button>
          </>
        ) : <div className="empty-member"><Search size={28} /><h2>Busca un miembro</h2><p>Verifica la vigencia antes de registrar el acceso.</p></div>}
      </section>
    </div>
  );
}
