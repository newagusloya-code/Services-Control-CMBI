// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessWorkflow } from './AccessWorkflow';

afterEach(() => cleanup());

const anaLopez = {
  id: 'CMBI-2001',
  name: 'Ana López',
  phone: '664 555 2001',
  age: 36,
  plan: 'Integral',
  services: ['alberca', 'gimnasio', 'sauna', 'therapy'],
  expiry: '2099-12-31',
  notes: '',
};

const brunoCano = {
  id: 'CMBI-2002',
  name: 'Bruno Cano',
  phone: '664 555 2002',
  age: 28,
  plan: 'Esencial',
  services: ['gimnasio'],
  expiry: '2099-12-31',
  notes: '',
};

const expiredMember = {
  id: 'CMBI-3003',
  name: 'Carla Ruiz',
  phone: '664 555 3003',
  age: 50,
  plan: 'Activo',
  services: ['gimnasio', 'alberca'],
  expiry: '2000-01-01',
  notes: '',
};

describe('AccessWorkflow', () => {
  it('muestra el estado vacío cuando no hay miembros ni miembro inicial', () => {
    render(<AccessWorkflow members={[]} initialMember={null} onCheckIn={vi.fn()} onToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Busca un miembro' })).toBeTruthy();
  });

  it('filtra sugerencias por nombre y permite seleccionarlas', async () => {
    const user = userEvent.setup();
    render(<AccessWorkflow members={[anaLopez, brunoCano]} initialMember={null} onCheckIn={vi.fn()} onToast={vi.fn()} />);

    // Ana López queda seleccionada por defecto (primer miembro de la lista).
    expect(screen.getByRole('heading', { name: 'Ana López' })).toBeTruthy();

    await user.clear(screen.getByLabelText('ID, teléfono o nombre'));
    await user.type(screen.getByLabelText('ID, teléfono o nombre'), 'Bruno');
    const suggestion = await screen.findByRole('button', { name: /Bruno Cano/ });
    await user.click(suggestion);

    expect(screen.getByRole('heading', { name: 'Bruno Cano' })).toBeTruthy();
    expect(screen.getByLabelText('ID, teléfono o nombre').value).toBe('Bruno Cano');
  });

  it('cambia automáticamente el servicio si el miembro elegido no lo incluye', async () => {
    const user = userEvent.setup();
    render(<AccessWorkflow members={[anaLopez, brunoCano]} initialMember={null} onCheckIn={vi.fn()} onToast={vi.fn()} />);

    await user.clear(screen.getByLabelText('ID, teléfono o nombre'));
    await user.type(screen.getByLabelText('ID, teléfono o nombre'), 'Bruno');
    await user.click(await screen.findByRole('button', { name: /Bruno Cano/ }));

    // Bruno solo tiene gimnasio; el segmento de Alberca (predeterminado) ya no debe quedar seleccionado.
    expect(screen.getByRole('button', { name: /Gimnasio/ }).className).toContain('selected');
    expect(screen.getByRole('button', { name: /Alberca/ }).className).not.toContain('selected');
  });

  it('notifica un error cuando la búsqueda no encuentra coincidencias y no hay miembro seleccionado', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    render(<AccessWorkflow members={[]} initialMember={null} onCheckIn={vi.fn()} onToast={onToast} />);

    await user.type(screen.getByLabelText('ID, teléfono o nombre'), 'nombre-inexistente');
    await user.click(screen.getByRole('button', { name: 'Buscar miembro' }));

    expect(onToast).toHaveBeenCalledWith('Escribe el nombre, teléfono o ID de un miembro.', 'error');
  });

  it('muestra la etiqueta de membresía vencida', () => {
    render(<AccessWorkflow members={[expiredMember]} initialMember={expiredMember} onCheckIn={vi.fn()} onToast={vi.fn()} />);
    expect(screen.getByText('Membresía vencida')).toBeTruthy();
  });

  it('registra el check-in exitoso, notifica el locker asignado e invoca onTicket', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn().mockResolvedValue({ ok: true, session: { service: 'alberca', locker: 'A-05' } });
    const onToast = vi.fn();
    const onTicket = vi.fn();

    render(
      <AccessWorkflow
        members={[anaLopez]}
        initialMember={anaLopez}
        onCheckIn={onCheckIn}
        onToast={onToast}
        onTicket={onTicket}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Alberca' }));
    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(onCheckIn).toHaveBeenCalledWith(anaLopez, 'alberca', { therapyType: '' }));
    expect(onTicket).toHaveBeenCalledWith(expect.objectContaining({ locker: 'A-05' }));
    expect(onToast).toHaveBeenCalledWith('Entrada registrada. Locker A-05.', 'success');
  });

  it('muestra el error del check-in sin invocar onTicket', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn().mockResolvedValue({ ok: false, message: 'El miembro ya tiene una sesión activa.' });
    const onToast = vi.fn();
    const onTicket = vi.fn();

    render(
      <AccessWorkflow
        members={[anaLopez]}
        initialMember={anaLopez}
        onCheckIn={onCheckIn}
        onToast={onToast}
        onTicket={onTicket}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('El miembro ya tiene una sesión activa.', 'error'));
    expect(onTicket).not.toHaveBeenCalled();
  });

  it('muestra el campo de terapia únicamente cuando el servicio Therapy está seleccionado', async () => {
    const user = userEvent.setup();
    render(<AccessWorkflow members={[anaLopez]} initialMember={anaLopez} onCheckIn={vi.fn()} onToast={vi.fn()} />);

    expect(screen.queryByLabelText('Terapia específica')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Therapy' }));
    expect(screen.getByLabelText('Terapia específica')).toBeTruthy();
  });
});