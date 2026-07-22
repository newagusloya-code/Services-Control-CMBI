import { Printer } from 'lucide-react';
import { useState } from 'react';
import { AccessWorkflow } from '../components/AccessWorkflow';
import { SessionsTable } from '../components/SessionsTable';
import { SERVICES } from '../config';

export function CheckInView({ state, initialMember, onCheckIn, onCheckOut, onToast }) {
  const [ticket, setTicket] = useState(null);

  const printTicket = () => window.print();

  return (
    <div className="standard-view checkin-view">
      <div className="view-heading"><div><h2>Entrada y salida</h2><p>Valida la membresía, el servicio y la capacidad antes de registrar.</p></div></div>
      <AccessWorkflow members={state.members} initialMember={initialMember} onCheckIn={onCheckIn} onToast={onToast} onTicket={setTicket} />
      {ticket && (
        <section className="ticket-panel" aria-live="polite">
          <div><span className="ticket-success">Entrada registrada</span><h3>{ticket.memberName}</h3><p>{SERVICES[ticket.service].label} · Locker {ticket.locker ?? 'sin asignar'}</p><small>{ticket.ticketId}</small></div>
          <button className="secondary-button" onClick={printTicket}><Printer size={18} /> Imprimir ticket</button>
        </section>
      )}
      <SessionsTable sessions={state.sessions} onCheckOut={onCheckOut} onToast={onToast} limit={12} />
    </div>
  );
}
