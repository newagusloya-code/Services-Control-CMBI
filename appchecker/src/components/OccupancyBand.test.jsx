// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { OccupancyBand } from './OccupancyBand';

afterEach(() => cleanup());

const activeSession = (service, id) => ({ id, service, checkIn: new Date().toISOString(), checkOut: null });
const closedSession = (service, id) => ({ id, service, checkIn: new Date().toISOString(), checkOut: new Date().toISOString() });

describe('OccupancyBand', () => {
  it('muestra ocupación cero y disponibilidad completa sin sesiones', () => {
    render(<OccupancyBand sessions={[]} />);

    expect(screen.getByText('Alberca')).toBeTruthy();
    expect(screen.getByText('Gimnasio')).toBeTruthy();
    expect(screen.getByText('Sauna')).toBeTruthy();
    expect(screen.getByText('Therapy')).toBeTruthy();
    expect(screen.getByText('20 lugares disponibles')).toBeTruthy();
    expect(screen.getByText('2 lugares disponibles')).toBeTruthy();
  });

  it('ignora las sesiones ya cerradas al calcular la ocupación', () => {
    const sessions = [closedSession('alberca', 'a1'), closedSession('alberca', 'a2')];
    const { container } = render(<OccupancyBand sessions={sessions} />);
    const albercaItem = [...container.querySelectorAll('.occupancy-item')].find((item) => item.textContent.includes('Alberca'));
    expect(albercaItem.querySelector('strong').textContent).toBe('0');
  });

  it('cuenta únicamente las sesiones activas del servicio correspondiente', () => {
    const sessions = [activeSession('sauna', 's1'), activeSession('sauna', 's2'), activeSession('alberca', 'a1')];
    const { container } = render(<OccupancyBand sessions={sessions} />);
    const saunaItem = [...container.querySelectorAll('.occupancy-item')].find((item) => item.textContent.includes('Sauna'));
    expect(saunaItem.querySelector('strong').textContent).toBe('2');
    expect(saunaItem.className).toContain('occupancy-danger');
    expect(saunaItem.textContent).toContain('Sin lugares disponibles');
  });

  it('muestra el singular cuando queda exactamente un lugar disponible', () => {
    const sessions = Array.from({ length: 1 }, (_, index) => activeSession('sauna', `s${index}`));
    render(<OccupancyBand sessions={sessions} />);
    expect(screen.getByText('1 lugar disponible')).toBeTruthy();
  });

  it('asigna el tono correcto según el tipo de servicio con baja ocupación', () => {
    const { container } = render(<OccupancyBand sessions={[]} />);
    const items = [...container.querySelectorAll('.occupancy-item')];
    const byLabel = (label) => items.find((item) => item.textContent.includes(label));

    expect(byLabel('Alberca').className).toContain('occupancy-success');
    expect(byLabel('Gimnasio').className).toContain('occupancy-info');
    expect(byLabel('Therapy').className).toContain('occupancy-therapy');
  });

  it('cambia a advertencia cuando la ocupación supera el 65% de la capacidad', () => {
    // Gimnasio: capacidad 50, 65% => 32.5, 33 sesiones activas produce una razón > 0.65
    const sessions = Array.from({ length: 33 }, (_, index) => activeSession('gimnasio', `g${index}`));
    const { container } = render(<OccupancyBand sessions={sessions} />);
    const gymItem = [...container.querySelectorAll('.occupancy-item')].find((item) => item.textContent.includes('Gimnasio'));
    expect(gymItem.className).toContain('occupancy-warning');
  });
});