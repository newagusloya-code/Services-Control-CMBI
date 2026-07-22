import { useMemo, useState } from 'react';
import { DoorOpen, Dumbbell, Ellipsis, HeartPulse, LogOut, MessageCircle, Waves } from 'lucide-react';
import { SERVICES } from '../config';
import { activeSessions, daysRemaining, getSessionAssignment, getSessionStatus } from '../lib/domain';

const ICONS = { alberca: Waves, gimnasio: Dumbbell, sauna: DoorOpen, therapy: HeartPulse };

const formatElapsed = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

const whatsappNumber = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  return digits.length === 10 ? `52${digits}` : digits;
};

export function SessionsTable({ sessions, members = [], onCheckOut, onToast, limit = 8 }) {
  const [filter, setFilter] = useState('all');
  const [openRow, setOpenRow] = useState(null);
  const [endedSession, setEndedSession] = useState(null);
  const active = useMemo(() => activeSessions(sessions)
    .map((session) => ({ ...session, status: getSessionStatus(session) }))
    .filter((session) => filter === 'all' || (filter === 'warning' ? session.status.tone === 'warning' : session.status.tone === 'danger'))
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn)), [filter, sessions]);

  const checkout = async (id) => {
    const result = await onCheckOut(id);
    setOpenRow(null);
    if (result.ok) setEndedSession(result.session);
    onToast(result.ok ? `Salida registrada. Duración: ${result.duration} min.` : result.message, result.ok ? 'success' : 'error');
  };

  const endedMember = endedSession ? members.find((member) => member.id === endedSession.memberId) : null;
  const whatsappMessage = endedSession && endedMember
    ? [
      `Resumen de sesión - ${SERVICES[endedSession.service].label}`,
      endedSession.therapyType ? `Terapia: ${endedSession.therapyType}` : null,
      `Duración: ${endedSession.duration} min`,
      `Fecha: ${new Date(endedSession.checkOut).toLocaleDateString('es-MX')}`,
      `Días restantes de vigencia: ${daysRemaining(endedMember.expiry)}`,
    ].filter(Boolean).join('\n')
    : '';
  const whatsappHref = endedMember
    ? `https://wa.me/${whatsappNumber(endedMember.phone)}?text=${encodeURIComponent(whatsappMessage)}`
    : '';

  return (
    <section className="sessions-section">
      {endedSession && endedMember && (
        <div className="session-end-panel" role="status">
          <div><strong>Salida registrada</strong><span>{endedMember.name} · {endedSession.duration} min</span></div>
          <a className="secondary-button" href={whatsappHref} target="_blank" rel="noreferrer"><MessageCircle size={17} /> Enviar por WhatsApp</a>
        </div>
      )}
      <div className="section-heading">
        <h2>Sesiones activas <span>{activeSessions(sessions).length}</span></h2>
        <div className="filter-segments" role="group" aria-label="Filtrar sesiones">
          <button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>Todas</button>
          <button className={filter === 'warning' ? 'selected' : ''} onClick={() => setFilter('warning')}>Por vencer</button>
          <button className={filter === 'danger' ? 'selected' : ''} onClick={() => setFilter('danger')}>Excedidas</button>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Miembro</th><th>Servicio</th><th>Entrada</th><th>Tiempo</th><th>Locker / Consultorio</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>
            {active.slice(0, limit).map((session) => {
              const Icon = ICONS[session.service];
              return (
                <tr key={session.id}>
                  <td><span className="table-person"><span className="mini-avatar">{session.memberName.slice(0, 1)}</span><span><strong>{session.memberName}</strong><small>{session.memberId}</small></span></span></td>
                  <td><span className="service-cell"><Icon size={19} /><span>{SERVICES[session.service].label}{session.therapyType && <small>{session.therapyType}</small>}</span></span></td>
                  <td>{new Date(session.checkIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{formatElapsed(session.status.elapsed)}</td>
                  <td>{getSessionAssignment(session)}</td>
                  <td><span className={`status-tag status-${session.status.tone}`}>{session.status.label}</span></td>
                  <td className="row-action">
                    <button className="icon-button" onClick={() => setOpenRow(openRow === session.id ? null : session.id)} aria-label={`Acciones para ${session.memberName}`} title="Acciones"><Ellipsis size={19} /></button>
                    {openRow === session.id && <div className="row-menu"><button onClick={() => checkout(session.id)}><LogOut size={16} /> Registrar salida</button></div>}
                  </td>
                </tr>
              );
            })}
            {!active.length && <tr><td colSpan="7" className="empty-row">No hay sesiones con este estado.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
