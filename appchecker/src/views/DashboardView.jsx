import { ArrowDownRight, ArrowRight, ArrowUpRight, TriangleAlert, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AccessWorkflow } from '../components/AccessWorkflow';
import { OccupancyBand } from '../components/OccupancyBand';
import { SessionsTable } from '../components/SessionsTable';
import { activeSessions, occupancyFor } from '../lib/domain';

export function DashboardView({ state, initialMember, onCheckIn, onCheckOut, onToast, onOpenReports }) {
  const [alertVisible, setAlertVisible] = useState(true);
  const today = new Date().toDateString();
  const todaySessions = state.sessions.filter((session) => new Date(session.checkIn).toDateString() === today);
  const todayExits = state.sessions.filter((session) => session.checkOut && new Date(session.checkOut).toDateString() === today);
  const activity = useMemo(() => [...state.sessions].sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn)).slice(0, 5), [state.sessions]);
  const saunaAvailable = 8 - occupancyFor(state.sessions, 'sauna');

  return (
    <div className="dashboard-view">
      <OccupancyBand sessions={state.sessions} />
      {alertVisible && saunaAvailable <= 1 && (
        <div className="capacity-alert" role="status"><TriangleAlert size={19} /><strong>Sauna casi lleno:</strong> {Math.max(0, saunaAvailable)} lugar disponible<button className="text-button" onClick={() => setAlertVisible(false)}>Cerrar</button></div>
      )}
      <div className="dashboard-grid">
        <div className="dashboard-main">
          <AccessWorkflow members={state.members} initialMember={initialMember ?? state.members[0]} onCheckIn={onCheckIn} onToast={onToast} compact />
          <SessionsTable sessions={state.sessions} onCheckOut={onCheckOut} onToast={onToast} limit={5} />
        </div>
        <aside className="activity-rail">
          <h2>Actividad de hoy</h2>
          <div className="activity-stats">
            <div><span className="stat-icon stat-green"><ArrowRight size={17} /></span><strong>{todaySessions.length}</strong><span>entradas</span></div>
            <div><span className="stat-icon stat-blue"><ArrowDownRight size={17} /></span><strong>{todayExits.length}</strong><span>salidas</span></div>
            <div><span className="stat-icon stat-amber"><Users size={17} /></span><strong>{activeSessions(state.sessions).length}</strong><span>activas</span></div>
          </div>
          <div className="activity-list">
            {activity.map((session) => (
              <div key={session.id}>
                <time>{new Date(session.checkIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</time>
                <span className={`timeline-icon ${session.checkOut ? 'timeline-blue' : 'timeline-green'}`}>{session.checkOut ? <ArrowDownRight size={15} /> : <ArrowUpRight size={15} />}</span>
                <p><strong>{session.memberName}</strong><span>{session.service} · {session.checkOut ? 'Salida' : 'Entrada'}</span></p>
              </div>
            ))}
          </div>
          <button className="link-button" onClick={onOpenReports}>Ver toda la actividad <ArrowRight size={17} /></button>
        </aside>
      </div>
    </div>
  );
}
