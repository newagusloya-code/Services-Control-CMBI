// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionsTable } from './SessionsTable';

afterEach(() => cleanup());

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

const member = {
  id: 'CMBI-2001',
  name: 'Ana López',
  phone: '664 555 2001',
};

// Alberca: límite de 45 minutos.
const onTimeSession = { id: 's-on-time', memberId: member.id, memberName: member.name, service: 'alberca', locker: 'A-01', checkIn: minutesAgo(5), checkOut: null };
const warningSession = { id: 's-warning', memberId: member.id, memberName: member.name, service: 'alberca', locker: 'A-02', checkIn: minutesAgo(35), checkOut: null };
const overdueSession = { id: 's-overdue', memberId: member.id, memberName: member.name, service: 'alberca', locker: 'A-03', checkIn: minutesAgo(60), checkOut: null };

describe('SessionsTable', () => {
  it('filtra las sesiones activas por estado', async () => {
    const user = userEvent.setup();
    render(
      <SessionsTable
        sessions={[onTimeSession, warningSession, overdueSession]}
        members={[member]}
        onCheckOut={vi.fn()}
        onToast={vi.fn()}
      />,
    );

    // Sin filtro: se muestran las tres.
    expect(screen.getAllByRole('row')).toHaveLength(4); // encabezado + 3 filas

    await user.click(screen.getByRole('button', { name: 'Por vencer' }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('A-02')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Excedidas' }));
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('A-03')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Todas' }));
    expect(screen.getAllByRole('row')).toHaveLength(4);
  });

  it('muestra un mensaje cuando no hay sesiones para el filtro elegido', async () => {
    const user = userEvent.setup();
    render(<SessionsTable sessions={[onTimeSession]} members={[member]} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Excedidas' }));
    expect(screen.getByText('No hay sesiones con este estado.')).toBeTruthy();
  });

  it('respeta el límite de filas mostradas', () => {
    render(
      <SessionsTable
        sessions={[onTimeSession, warningSession, overdueSession]}
        members={[member]}
        onCheckOut={vi.fn()}
        onToast={vi.fn()}
        limit={1}
      />,
    );

    const body = screen.getAllByRole('rowgroup')[1];
    expect(within(body).getAllByRole('row')).toHaveLength(1);
  });

  it('muestra el contador total de sesiones activas', () => {
    render(
      <SessionsTable
        sessions={[onTimeSession, warningSession, overdueSession]}
        members={[member]}
        onCheckOut={vi.fn()}
        onToast={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: /Sesiones activas/ }).textContent).toContain('3');
  });

  it('notifica un error de salida y no muestra el panel de WhatsApp', async () => {
    const user = userEvent.setup();
    const onCheckOut = vi.fn().mockResolvedValue({ ok: false, message: 'La sesión ya no está activa.' });
    const onToast = vi.fn();

    render(<SessionsTable sessions={[onTimeSession]} members={[member]} onCheckOut={onCheckOut} onToast={onToast} />);

    await user.click(screen.getByRole('button', { name: `Acciones para ${member.name}` }));
    await user.click(screen.getByRole('button', { name: 'Registrar salida' }));

    expect(onToast).toHaveBeenCalledWith('La sesión ya no está activa.', 'error');
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('link', { name: 'Enviar por WhatsApp' })).toBeNull();
  });
});