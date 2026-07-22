import { DoorOpen, Dumbbell, Waves } from 'lucide-react';
import { SERVICES } from '../config';
import { occupancyFor } from '../lib/domain';

const ICONS = { alberca: Waves, gimnasio: Dumbbell, sauna: DoorOpen };

export function OccupancyBand({ sessions }) {
  return (
    <section className="occupancy-band" aria-label="Ocupación actual">
      {Object.entries(SERVICES).map(([id, service]) => {
        const count = occupancyFor(sessions, id);
        const available = Math.max(0, service.capacity - count);
        const ratio = count / service.capacity;
        const tone = ratio >= 0.85 ? 'danger' : ratio >= 0.65 ? 'warning' : id === 'gimnasio' ? 'info' : 'success';
        const Icon = ICONS[id];
        return (
          <div className={`occupancy-item occupancy-${tone}`} key={id}>
            <Icon size={45} strokeWidth={1.75} />
            <div className="occupancy-copy">
              <h2>{service.label}</h2>
              <p><strong>{count}</strong><span>/ {service.capacity}</span></p>
              <div className="capacity-track"><span style={{ width: `${Math.min(100, ratio * 100)}%` }} /></div>
              <small>{available === 0 ? 'Sin lugares disponibles' : available === 1 ? '1 lugar disponible' : `${available} lugares disponibles`}</small>
            </div>
          </div>
        );
      })}
    </section>
  );
}
