// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessWorkflow } from './AccessWorkflow';
import { SessionsTable } from './SessionsTable';
import { MembersView } from '../views/MembersView';
import { SettingsView } from '../views/SettingsView';
import { CheckInView } from '../views/CheckInView';
import { DashboardView } from '../views/DashboardView';

afterEach(() => cleanup());

const activeMember = {
  id: 'CMBI-2001',
  name: 'Ana López',
  phone: '664 555 2001',
  age: 36,
  plan: 'Integral',
  services: ['alberca', 'gimnasio', 'sauna', 'therapy'],
  expiry: '2099-12-31',
  notes: '',
};

describe('flujos críticos de la interfaz', () => {
  it('registra Therapy con una descripción libre y recibe consultorio', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn().mockResolvedValue({
      ok: true,
      session: { service: 'therapy', therapyType: 'Masaje relajante', room: 'Ruby' },
    });
    const onTicket = vi.fn();

    render(
      <AccessWorkflow
        members={[activeMember]}
        initialMember={activeMember}
        onCheckIn={onCheckIn}
        onToast={vi.fn()}
        onTicket={onTicket}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Therapy' }));
    await user.type(screen.getByLabelText('Terapia específica'), 'Masaje relajante');
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(onCheckIn).toHaveBeenCalledWith(activeMember, 'therapy', { therapyType: 'Masaje relajante' }));
    expect(onTicket).toHaveBeenCalledWith(expect.objectContaining({ room: 'Ruby' }));
  });

  it('crea un miembro sin correo y muestra su credencial digital', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<MembersView members={[]} onSave={onSave} onDelete={vi.fn()} onToast={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Nuevo miembro' }));
    await user.type(screen.getByLabelText('Nombre completo'), 'Luisa Medina');
    await user.type(screen.getByLabelText('Teléfono (WhatsApp)'), '664 555 7788');
    await user.type(screen.getByLabelText('Edad'), '41');
    await user.click(screen.getByRole('button', { name: 'Guardar miembro' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0][0];
    expect(saved).toMatchObject({ name: 'Luisa Medina', phone: '664 555 7788', age: 41 });
    expect(saved.id).toMatch(/^CMBI-\d{4}$/);
    expect(saved).not.toHaveProperty('email');
    expect(screen.getByRole('heading', { name: 'Credencial generada' })).toBeTruthy();
    expect(screen.getByLabelText('Credencial digital de Luisa Medina')).toBeTruthy();
  });

  it('construye el resumen de WhatsApp al terminar una sesión', async () => {
    const user = userEvent.setup();
    const session = {
      id: 'session-1',
      memberId: activeMember.id,
      memberName: activeMember.name,
      service: 'therapy',
      therapyType: 'Facial hidratante',
      room: 'Topacio',
      checkIn: new Date(Date.now() - 45 * 60_000).toISOString(),
      checkOut: null,
    };
    const ended = { ...session, checkOut: new Date().toISOString(), duration: 45 };
    const onCheckOut = vi.fn().mockResolvedValue({ ok: true, duration: 45, session: ended });

    render(<SessionsTable sessions={[session]} members={[activeMember]} onCheckOut={onCheckOut} onToast={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: `Acciones para ${activeMember.name}` }));
    await user.click(screen.getByRole('button', { name: 'Registrar salida' }));

    const link = await screen.findByRole('link', { name: 'Enviar por WhatsApp' });
    const href = link.getAttribute('href');
    expect(href).toContain('https://wa.me/526645552001?text=');
    expect(decodeURIComponent(href)).toContain('Therapy');
    expect(decodeURIComponent(href)).toContain('Facial hidratante');
    expect(decodeURIComponent(href)).toContain('Duración: 45 min');
    expect(decodeURIComponent(href)).toContain('Días restantes de vigencia:');
  });

  it('normaliza y guarda precios de Therapy desde Configuración', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <SettingsView
        settings={{ therapyPrices: {}, backupSchedule: 'manual', lastBackupAt: null }}
        onSave={onSave}
        onPrepareBackups={vi.fn()}
        onCreateBackup={vi.fn()}
        onRestoreBackup={vi.fn()}
        onGetBackupStatus={vi.fn().mockResolvedValue({ configured: false, latestAt: null })}
        onToast={vi.fn()}
      />,
    );

    await user.type(screen.getByPlaceholderText('Nombre de terapia'), 'Masaje Relajante');
    await user.type(screen.getByPlaceholderText('Precio MXN'), '650');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));
    await user.click(screen.getByRole('button', { name: 'Guardar precios' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      therapyPrices: {
        'masaje relajante': { label: 'Masaje Relajante', price: 650 },
      },
    }));
  });

  it('conecta clave, frecuencia y restauración en Configuración', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onPrepareBackups = vi.fn().mockResolvedValue({ configured: true, latestAt: null });
    const onRestoreBackup = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <SettingsView
        settings={{ therapyPrices: {}, backupSchedule: 'manual', lastBackupAt: null }}
        onSave={onSave}
        onPrepareBackups={onPrepareBackups}
        onCreateBackup={vi.fn()}
        onRestoreBackup={onRestoreBackup}
        onGetBackupStatus={vi.fn().mockResolvedValue({ configured: false, latestAt: null })}
        onToast={vi.fn()}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Frecuencia'), 'daily');
    await user.type(screen.getByLabelText('Clave del respaldo'), 'clave-respaldo-2026');
    await user.click(screen.getByRole('button', { name: 'Guardar programación' }));
    await waitFor(() => expect(onPrepareBackups).toHaveBeenCalledWith('clave-respaldo-2026'));
    expect(onSave).toHaveBeenCalledWith({ backupSchedule: 'daily' });

    await user.type(screen.getByLabelText('Clave para restaurar'), 'clave-respaldo-2026');
    const file = new File([JSON.stringify({ app: 'Service Control CMBI', version: 1 })], 'respaldo.json', { type: 'application/json' });
    await user.upload(container.querySelector('input[type="file"]'), file);
    await waitFor(() => expect(onRestoreBackup).toHaveBeenCalledWith({ app: 'Service Control CMBI', version: 1 }, 'clave-respaldo-2026'));
  });

  it('prepara un ticket limitado a los datos de la sesión antes de imprimir', async () => {
    const user = userEvent.setup();
    const print = vi.fn(() => expect(document.body.classList.contains('printing-ticket')).toBe(true));
    window.print = print;
    const session = {
      id: 'ticket-1',
      ticketId: 'TKT-1001',
      memberId: activeMember.id,
      memberName: activeMember.name,
      service: 'alberca',
      locker: 'A-12',
      room: null,
      checkIn: new Date().toISOString(),
      checkOut: null,
    };

    render(
      <CheckInView
        state={{ members: [activeMember], sessions: [] }}
        initialMember={activeMember}
        onCheckIn={vi.fn().mockResolvedValue({ ok: true, session })}
        onCheckOut={vi.fn()}
        onToast={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));
    const ticket = await screen.findByText('TKT-1001');
    const ticketPanel = ticket.closest('.print-ticket');
    expect(ticketPanel.textContent).toContain(activeMember.name);
    expect(ticketPanel.textContent).toContain('Alberca');
    expect(ticketPanel.textContent).toContain('A-12');
    expect(ticketPanel.textContent).toContain('Entrada:');
    await user.click(within(ticketPanel).getByRole('button', { name: 'Imprimir ticket' }));
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('conserva el aviso Tiempo Extra detectado para sesiones excedidas', () => {
    const overdueSession = {
      id: 'overdue-1',
      memberId: activeMember.id,
      memberName: activeMember.name,
      service: 'gimnasio',
      locker: 'G-01',
      checkIn: new Date(Date.now() - 120 * 60_000).toISOString(),
      checkOut: null,
    };
    const state = {
      members: [activeMember],
      sessions: [overdueSession],
      lockers: [],
    };

    render(<DashboardView state={state} initialMember={activeMember} onCheckIn={vi.fn()} onCheckOut={vi.fn()} onToast={vi.fn()} onOpenReports={vi.fn()} />);
    expect(screen.getByRole('alert').textContent).toContain('Tiempo Extra detectado');
    expect(screen.getByRole('alert').textContent).toContain('1 sesión superó su límite de permanencia.');
  });
});
