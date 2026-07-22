import { useMemo, useState } from 'react';
import { CircleAlert, LockKeyhole, Wrench } from 'lucide-react';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'free', label: 'Disponibles' },
  { id: 'occupied', label: 'Ocupados' },
  { id: 'maintenance', label: 'Mantenimiento' },
];

export function LockersView({ lockers, onToggle, onToast }) {
  const [filter, setFilter] = useState('all');
  const filtered = useMemo(() => lockers.filter((locker) => filter === 'all' || locker.status === filter), [filter, lockers]);
  const counts = Object.fromEntries(['free', 'occupied', 'maintenance'].map((status) => [status, lockers.filter((item) => item.status === status).length]));

  const toggle = async (locker) => {
    const changed = await onToggle(locker.id);
    onToast(changed ? `Locker ${locker.id} actualizado.` : 'Los lockers ocupados se liberan al registrar la salida.', changed ? 'success' : 'error');
  };

  return (
    <div className="standard-view">
      <div className="view-heading"><div><h2>Lockers</h2><p>Los lockers ocupados se liberan automáticamente con la salida.</p></div></div>
      <div className="locker-summary"><div><strong>{counts.free}</strong><span>Disponibles</span></div><div><strong>{counts.occupied}</strong><span>Ocupados</span></div><div><strong>{counts.maintenance}</strong><span>Mantenimiento</span></div></div>
      <div className="filter-segments locker-filters">{FILTERS.map((item) => <button key={item.id} className={filter === item.id ? 'selected' : ''} onClick={() => setFilter(item.id)}>{item.label}</button>)}</div>
      <div className="locker-grid">
        {filtered.map((locker) => (
          <button key={locker.id} className={`locker-tile locker-${locker.status}`} onClick={() => toggle(locker)}>
            {locker.status === 'maintenance' ? <Wrench size={20} /> : locker.status === 'occupied' ? <LockKeyhole size={20} /> : <span className="locker-dot" />}
            <strong>{locker.id}</strong>
            <small>{locker.status === 'free' ? 'Disponible' : locker.status === 'occupied' ? 'Ocupado' : 'Mantenimiento'}</small>
          </button>
        ))}
      </div>
      <p className="inline-note"><CircleAlert size={17} /> Selecciona un locker disponible para ponerlo en mantenimiento.</p>
    </div>
  );
}
