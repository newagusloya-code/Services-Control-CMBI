import { Download, Printer, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SERVICES } from '../config';
import { csvEscape } from '../lib/domain';

const todayString = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

export function ReportsView({ sessions, onToast }) {
  const [service, setService] = useState('all');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(todayString());
  const [query, setQuery] = useState('');
  const rows = useMemo(() => sessions.filter((session) => {
    const day = session.checkIn.slice(0, 10);
    const matchesService = service === 'all' || session.service === service;
    const matchesQuery = `${session.memberName} ${session.memberId}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'));
    return day >= from && day <= to && matchesService && matchesQuery;
  }).sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn)), [from, query, service, sessions, to]);
  const completed = rows.filter((row) => row.checkOut);
  const average = completed.length ? Math.round(completed.reduce((total, row) => total + (row.duration ?? Math.round((new Date(row.checkOut) - new Date(row.checkIn)) / 60_000)), 0) / completed.length) : 0;

  const exportCsv = () => {
    const header = ['Fecha', 'Miembro', 'ID', 'Servicio', 'Entrada', 'Salida', 'Duración (min)', 'Locker'];
    const body = rows.map((row) => [row.checkIn.slice(0, 10), row.memberName, row.memberId, SERVICES[row.service].label, row.checkIn, row.checkOut ?? '', row.duration ?? '', row.locker ?? '']);
    const csv = [header, ...body].map((line) => line.map(csvEscape).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `checksport-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    onToast('Reporte CSV descargado.', 'success');
  };

  return (
    <div className="standard-view">
      <div className="view-heading"><div><h2>Reportes</h2><p>Filtra el historial local y exporta los resultados visibles.</p></div><div className="heading-actions"><button className="secondary-button" onClick={() => window.print()}><Printer size={18} /> Imprimir</button><button className="primary-button" onClick={exportCsv}><Download size={18} /> Exportar CSV</button></div></div>
      <div className="report-filters">
        <label>Desde<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
        <label>Hasta<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <label>Servicio<select value={service} onChange={(event) => setService(event.target.value)}><option value="all">Todos</option>{Object.entries(SERVICES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}</select></label>
        <label className="report-search"><span>Miembro</span><span className="input-with-icon"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre o ID" /></span></label>
      </div>
      <div className="report-summary"><div><span>Sesiones</span><strong>{rows.length}</strong></div><div><span>Completadas</span><strong>{completed.length}</strong></div><div><span>Duración promedio</span><strong>{average} min</strong></div></div>
      <div className="table-frame table-scroll">
        <table><thead><tr><th>Fecha</th><th>Miembro</th><th>Servicio</th><th>Entrada</th><th>Salida</th><th>Duración</th><th>Locker</th></tr></thead><tbody>{rows.slice(0, 200).map((row) => <tr key={row.id}><td>{new Date(row.checkIn).toLocaleDateString('es-MX')}</td><td><strong className="cell-main">{row.memberName}</strong><small className="cell-sub">{row.memberId}</small></td><td>{SERVICES[row.service].label}</td><td>{new Date(row.checkIn).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</td><td>{row.checkOut ? new Date(row.checkOut).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : 'Activa'}</td><td>{row.duration ? `${row.duration} min` : '—'}</td><td>{row.locker ?? '—'}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
