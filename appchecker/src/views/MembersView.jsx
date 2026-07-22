import { useMemo, useState } from 'react';
import { Edit3, Plus, Search, Trash2, X } from 'lucide-react';
import { PLAN_SERVICES, SERVICES } from '../config';
import { generateMemberId, isMemberActive } from '../lib/domain';
import { MembershipCard } from '../components/MembershipCard';

const emptyMember = (members) => {
  const expiry = new Date();
  expiry.setFullYear(expiry.getFullYear() + 1);
  return {
    id: generateMemberId(members),
    name: '',
    phone: '',
    age: '',
    plan: 'Activo',
    services: [...PLAN_SERVICES.Activo],
    expiry: expiry.toISOString().slice(0, 10),
    notes: '',
  };
};

export function MembersView({ members, onSave, onDelete, onToast }) {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [cardMember, setCardMember] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const filtered = useMemo(() => {
    const value = query.trim().toLocaleLowerCase('es');
    if (!value) return members;
    return members.filter((member) => `${member.name} ${member.id} ${member.phone}`.toLocaleLowerCase('es').includes(value));
  }, [members, query]);

  const openNew = () => {
    setEditing(emptyMember(members));
  };

  const save = async (event) => {
    event.preventDefault();
    const age = Number(editing.age);
    if (!editing.name.trim() || !editing.phone.trim() || !Number.isInteger(age) || age < 1 || age > 120 || !editing.plan || !editing.services.length || !editing.expiry) {
      onToast('Nombre, WhatsApp, edad, plan, servicio y vigencia son obligatorios.', 'error');
      return;
    }
    const saved = { ...editing, name: editing.name.trim(), phone: editing.phone.trim(), age };
    await onSave(saved);
    setEditing(null);
    setCardMember(saved);
    onToast('Miembro guardado.', 'success');
  };

  const remove = async () => {
    const result = await onDelete(deleteTarget.id);
    if (!result.ok) {
      onToast(result.message, 'error');
      return;
    }
    setDeleteTarget(null);
    onToast('Miembro eliminado.', 'success');
  };

  return (
    <div className="standard-view">
      <div className="view-heading">
        <div><h2>Miembros</h2><p>Consulta vigencias y servicios autorizados.</p></div>
        <button className="primary-button" onClick={openNew}><Plus size={18} /> Nuevo miembro</button>
      </div>
      <div className="table-toolbar">
        <label className="toolbar-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, ID o teléfono" /></label>
        <span>{filtered.length} registros</span>
      </div>
      <div className="table-frame table-scroll">
        <table>
          <thead><tr><th>Miembro</th><th>Contacto</th><th>Plan</th><th>Servicios</th><th>Vigencia</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{filtered.map((member) => (
            <tr key={member.id}>
              <td><span className="table-person"><span className="mini-avatar">{member.name.slice(0, 1)}</span><span><strong>{member.name}</strong><small>{member.id}</small></span></span></td>
              <td><strong className="cell-main">{member.phone}</strong><small className="cell-sub">{member.age ? `${member.age} años` : 'Edad pendiente'}</small></td>
              <td>{member.plan}</td>
              <td><span className="services-text">{member.services.map((id) => SERVICES[id]?.label).join(', ')}</span></td>
              <td>{new Date(`${member.expiry}T12:00:00`).toLocaleDateString('es-MX')}</td>
              <td><span className={`status-tag ${isMemberActive(member) ? 'status-success' : 'status-danger'}`}>{isMemberActive(member) ? 'Vigente' : 'Vencida'}</span></td>
              <td><span className="inline-actions"><button className="icon-button" onClick={() => setEditing({ ...member, services: [...member.services] })} aria-label={`Editar ${member.name}`} title="Editar"><Edit3 size={17} /></button><button className="icon-button danger-icon" onClick={() => setDeleteTarget(member)} aria-label={`Eliminar ${member.name}`} title="Eliminar"><Trash2 size={17} /></button></span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setEditing(null)}>
          <form className="modal-panel member-modal" onSubmit={save}>
            <div className="modal-heading"><div><h2>{members.some((member) => member.id === editing.id) ? 'Editar miembro' : 'Nuevo miembro'}</h2><p>Los cambios se guardan en este dispositivo.</p></div><button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Cerrar" title="Cerrar"><X size={20} /></button></div>
            <div className="form-grid">
              <label className="span-2">Nombre completo<input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} autoFocus /></label>
              <label>ID digital<input value={editing.id} disabled /></label>
              <label>Teléfono (WhatsApp)<input type="tel" value={editing.phone} onChange={(event) => setEditing({ ...editing, phone: event.target.value })} required /></label>
              <label>Edad<input type="number" min="1" max="120" value={editing.age} onChange={(event) => setEditing({ ...editing, age: event.target.value })} required /></label>
              <label>Plan<select value={editing.plan} onChange={(event) => setEditing({ ...editing, plan: event.target.value, services: [...PLAN_SERVICES[event.target.value]] })}>{Object.keys(PLAN_SERVICES).map((plan) => <option key={plan}>{plan}</option>)}</select></label>
              <label>Vigencia<input type="date" value={editing.expiry} onChange={(event) => setEditing({ ...editing, expiry: event.target.value })} /></label>
              <fieldset className="span-2"><legend>Servicios incluidos</legend><div className="checkbox-row">{Object.entries(SERVICES).map(([id, service]) => <label key={id}><input type="checkbox" checked={editing.services.includes(id)} onChange={(event) => setEditing({ ...editing, services: event.target.checked ? [...editing.services, id] : editing.services.filter((item) => item !== id) })} />{service.label}</label>)}</div></fieldset>
              <label className="span-2">Notas<textarea value={editing.notes} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} rows="3" /></label>
            </div>
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancelar</button><button className="primary-button" type="submit">Guardar miembro</button></div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop"><div className="modal-panel confirm-modal"><h2>Eliminar miembro</h2><p>Se eliminará a <strong>{deleteTarget.name}</strong>. El historial de visitas se conservará.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancelar</button><button className="danger-button" onClick={remove}>Eliminar</button></div></div></div>
      )}

      {cardMember && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setCardMember(null)}>
          <div className="modal-panel membership-card-modal">
            <div className="modal-heading"><div><h2>Credencial generada</h2><p>Lista para consultar desde este dispositivo.</p></div><button type="button" className="icon-button" onClick={() => setCardMember(null)} aria-label="Cerrar" title="Cerrar"><X size={20} /></button></div>
            <MembershipCard member={cardMember} />
            <div className="modal-actions"><button className="primary-button" onClick={() => setCardMember(null)}>Listo</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
