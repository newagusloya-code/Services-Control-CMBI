// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionsTable } from './SessionsTable';

afterEach(() => cleanup());

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();

const members = [
  { id: 'CMBI-4001', name: 'Fernanda Cruz', phone: '664 555 4001', expiry: '2099-12-31' },
  { id: 'CMBI-4002', name: 'Hugo Bravo', phone: '+52 664 555 4002', expiry: '2099-12-31' },
];

// gimnasio: 90 min límite -> "en tiempo" a los 5 min transcurridos.
const successSession = {
  id: 's1',
  memberId: 'CMBI-4001',
  memberName: 'Fernanda Cruz',
  service: 'gimnasio',
  checkIn: minutesAgo(5),
  checkOut: null,
  locker: 'G-01',
};

// alberca: 45 min límite -> "por vencer" (restante <= 15) a los 35 min transcurridos.
const warningSession = {
  id: 's2',
  memberId: 'CMBI-4002',
  memberName: 'Hugo Bravo',
  service: 'alberca',
  checkIn: minutesAgo(35),
  checkOut: null,
  locker: 'A-01',
};

// alberca: 45 min límite -> "excedida" (restante < 0) a los 50 min transcurridos.
const dangerSession = {
  id: 's3',
  memberId: 'CMBI-4003',
  memberName: 'Elsa Núñez',
  service: 'alberca',
  checkIn: minutesAgo(50),
  checkOut: null,
  locker: 'A-02',
};

const closedSession = {
  id: 's4',
  memberId: 'CMBI-4004',
  memberName: 'Miembro Cerrado',
  service: 'sauna',
  checkIn: minutesAgo(120),
  checkOut: minutesAgo(90),
  locker: 'S-01',
};

describe('SessionsTable', () => {
  it('muestra las sesiones activas con su servicio, hora y estado, y el conteo total en el encabezado', () => {
    render(<SessionsTable sessions={[successSession, warningSession, closedSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    expect(screen.getByText('Fernanda Cruz')).toBeTruthy();
    expect(screen.getByText('Hugo Bravo')).toBeTruthy();
    expect(screen.queryByText('Miembro Cerrado')).toBeNull();
    // El conteo del encabezado sólo considera sesiones sin checkOut.
    expect(screen.getByText('Sesiones activas').querySelector('span').textContent).toBe('2');
  });

  it('filtra para mostrar sólo las sesiones "Por vencer"', async () => {
    const user = userEvent.setup();
    render(<SessionsTable sessions={[successSession, warningSession, dangerSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Por vencer' }));

    expect(screen.getByText('Hugo Bravo')).toBeTruthy();
    expect(screen.queryByText('Fernanda Cruz')).toBeNull();
    expect(screen.queryByText('Elsa Núñez')).toBeNull();
  });

  it('filtra para mostrar sólo las sesiones "Excedidas"', async () => {
    const user = userEvent.setup();
    render(<SessionsTable sessions={[successSession, warningSession, dangerSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Excedidas' }));

    expect(screen.getByText('Elsa Núñez')).toBeTruthy();
    expect(screen.queryByText('Fernanda Cruz')).toBeNull();
    expect(screen.queryByText('Hugo Bravo')).toBeNull();
  });

  it('muestra un mensaje de tabla vacía cuando ningún registro coincide con el filtro activo', async () => {
    const user = userEvent.setup();
    render(<SessionsTable sessions={[successSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Excedidas' }));

    expect(screen.getByText('No hay sesiones con este estado.')).toBeTruthy();
  });

  it('limita el número de filas mostradas según la prop "limit" sin afectar el conteo del encabezado', () => {
    render(<SessionsTable sessions={[successSession, warningSession, dangerSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} limit={1} />);

    const rows = screen.getAllByRole('row').slice(1); // se descarta el encabezado
    expect(rows).toHaveLength(1);
    expect(screen.getByText('Sesiones activas').querySelector('span').textContent).toBe('3');
  });

  it('registra la salida, muestra el aviso de éxito y ofrece un enlace de WhatsApp con el número normalizado a 10 dígitos', async () => {
    const user = userEvent.setup();
    const onCheckOut = vi.fn().mockResolvedValue({
      ok: true,
      duration: 42,
      session: { ...successSession, checkOut: new Date().toISOString(), duration: 42 },
    });
    const onToast = vi.fn();
    render(<SessionsTable sessions={[successSession]} members={members} onCheckOut={onCheckOut} onToast={onToast} />);

    await user.click(screen.getByRole('button', { name: 'Acciones para Fernanda Cruz' }));
    await user.click(screen.getByRole('button', { name: 'Registrar salida' }));

    expect(onCheckOut).toHaveBeenCalledWith('s1');
    expect(onToast).toHaveBeenCalledWith('Salida registrada. Duración: 42 min.', 'success');

    const panel = screen.getByRole('status');
    expect(within(panel).getByText(/Fernanda Cruz/)).toBeTruthy();
    const link = within(panel).getByRole('link', { name: /Enviar por WhatsApp/ });
    expect(link.getAttribute('href')).toContain('https://wa.me/526645554001?text=');
  });

  it('conserva el número de WhatsApp sin agregar el prefijo 52 cuando ya tiene más de 10 dígitos', async () => {
    const user = userEvent.setup();
    const onCheckOut = vi.fn().mockResolvedValue({
      ok: true,
      duration: 20,
      session: { ...warningSession, checkOut: new Date().toISOString(), duration: 20 },
    });
    render(<SessionsTable sessions={[warningSession]} members={members} onCheckOut={onCheckOut} onToast={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Acciones para Hugo Bravo' }));
    await user.click(screen.getByRole('button', { name: 'Registrar salida' }));

    const link = await screen.findByRole('link', { name: /Enviar por WhatsApp/ });
    expect(link.getAttribute('href')).toContain('https://wa.me/526645554002?text=');
  });

  it('muestra un aviso de error y no abre el panel de salida cuando el checkout falla', async () => {
    const user = userEvent.setup();
    const onCheckOut = vi.fn().mockResolvedValue({ ok: false, message: 'No se pudo registrar la salida.' });
    const onToast = vi.fn();
    render(<SessionsTable sessions={[successSession]} members={members} onCheckOut={onCheckOut} onToast={onToast} />);

    await user.click(screen.getByRole('button', { name: 'Acciones para Fernanda Cruz' }));
    await user.click(screen.getByRole('button', { name: 'Registrar salida' }));

    expect(onToast).toHaveBeenCalledWith('No se pudo registrar la salida.', 'error');
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('cierra el menú de acciones de una fila al volver a hacer clic en su botón', async () => {
    const user = userEvent.setup();
    render(<SessionsTable sessions={[successSession]} members={members} onCheckOut={vi.fn()} onToast={vi.fn()} />);

    const actionsButton = screen.getByRole('button', { name: 'Acciones para Fernanda Cruz' });
    await user.click(actionsButton);
    expect(screen.getByRole('button', { name: 'Registrar salida' })).toBeTruthy();

    await user.click(actionsButton);
    expect(screen.queryByRole('button', { name: 'Registrar salida' })).toBeNull();
  });
});