// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildReportsCsv, ReportsView } from './ReportsView';

afterEach(() => cleanup());

const today = new Date();
const therapySession = {
  id: 'therapy-1',
  memberId: 'CMBI-3001',
  memberName: 'Carla Soto',
  service: 'therapy',
  therapyType: 'Facial hidratante',
  checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
  checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0).toISOString(),
  duration: 60,
  room: 'Onyx',
};
const gymSession = {
  id: 'gym-1',
  memberId: 'CMBI-3002',
  memberName: 'Jorge Paz',
  service: 'gimnasio',
  checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(),
  checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
  duration: 60,
  locker: 'G-08',
};
const settings = {
  therapyPrices: {
    'facial hidratante': { label: 'Facial hidratante', price: 550 },
  },
};

describe('Reportes', () => {
  it('genera CSV con BOM, separador de Excel y datos de Therapy', () => {
    const csv = buildReportsCsv([therapySession], settings);
    expect(csv.startsWith('\uFEFFFecha;Miembro;ID;Servicio;Terapia;')).toBe(true);
    expect(csv).toContain('Carla Soto;CMBI-3001;Therapy;Facial hidratante;');
    expect(csv).toContain(';Onyx;550');
    expect(csv).toContain('\r\n');
  });

  it('muestra las columnas requeridas y filtra por servicio', async () => {
    const user = userEvent.setup();
    render(<ReportsView sessions={[therapySession, gymSession]} settings={settings} onToast={vi.fn()} />);

    for (const column of ['Fecha', 'Miembro', 'ID', 'Servicio', 'Entrada', 'Salida', 'Duración', 'Locker / Consultorio']) {
      expect(screen.getByRole('columnheader', { name: column })).toBeTruthy();
    }

    await user.selectOptions(screen.getByLabelText('Servicio'), 'therapy');
    const body = screen.getAllByRole('rowgroup')[1];
    expect(within(body).getByText('Carla Soto')).toBeTruthy();
    expect(within(body).queryByText('Jorge Paz')).toBeNull();
    expect(within(body).getByText('Onyx')).toBeTruthy();
    expect(within(body).getByText('$550.00')).toBeTruthy();
  });
});
