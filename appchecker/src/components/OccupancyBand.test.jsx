// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { OccupancyBand } from './OccupancyBand';

afterEach(() => cleanup());

let sessionCounter = 0;
const activeSession = (service) => ({
  id: `session-${sessionCounter++}`,
  service,
  checkIn: new Date().toISOString(),
  checkOut: null,
});

describe('OccupancyBand', () => {
  it('muestra los cuatro servicios con su conteo y capacidad', () => {
    render(<OccupancyBand sessions={[activeSession('alberca')]} />);
    expect(screen.getByText('Alberca')).toBeTruthy();
    expect(screen.getByText('Gimnasio')).toBeTruthy();
    expect(screen.getByText('Sauna')).toBeTruthy();
    expect(screen.getByText('Therapy')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByText('/ 20')).toBeTruthy();
  });

  it('no cuenta sesiones ya cerradas para la ocupación', () => {
    const closed = { ...activeSession('alberca'), checkOut: new Date().toISOString() };
    render(<OccupancyBand sessions={[closed]} />);
    const albercaItem = screen.getByText('Alberca').closest('.occupancy-item');
    expect(albercaItem.querySelector('strong').textContent).toBe('0');
  });

  it('marca Sauna como sin lugares disponibles cuando alcanza su capacidad de 2', () => {
    render(<OccupancyBand sessions={[activeSession('sauna'), activeSession('sauna')]} />);
    const saunaItem = screen.getByText('Sauna').closest('.occupancy-item');
    expect(saunaItem.className).toContain('occupancy-danger');
    expect(saunaItem.textContent).toContain('Sin lugares disponibles');
  });

  it('usa singular para "1 lugar disponible"', () => {
    const sessions = Array.from({ length: 19 }, () => activeSession('alberca'));
    render(<OccupancyBand sessions={sessions} />);
    const albercaItem = screen.getByText('Alberca').closest('.occupancy-item');
    expect(albercaItem.textContent).toContain('1 lugar disponible');
  });

  it('usa plural para múltiples lugares disponibles', () => {
    render(<OccupancyBand sessions={[]} />);
    const albercaItem = screen.getByText('Alberca').closest('.occupancy-item');
    expect(albercaItem.textContent).toContain('20 lugares disponibles');
  });

  it('asigna el tono "info" a Gimnasio cuando su ocupación es baja', () => {
    render(<OccupancyBand sessions={[]} />);
    const gymItem = screen.getByText('Gimnasio').closest('.occupancy-item');
    expect(gymItem.className).toContain('occupancy-info');
  });

  it('asigna el tono "therapy" a Therapy cuando su ocupación es baja', () => {
    render(<OccupancyBand sessions={[activeSession('therapy')]} />);
    const therapyItem = screen.getByText('Therapy').closest('.occupancy-item');
    expect(therapyItem.className).toContain('occupancy-therapy');
  });

  it('escala el ancho de la barra de capacidad según la proporción ocupada, con tope de 100%', () => {
    render(<OccupancyBand sessions={[activeSession('sauna'), activeSession('sauna'), activeSession('sauna')]} />);
    const saunaItem = screen.getByText('Sauna').closest('.occupancy-item');
    const bar = saunaItem.querySelector('.capacity-track span');
    expect(bar.style.width).toBe('100%');
  });
});