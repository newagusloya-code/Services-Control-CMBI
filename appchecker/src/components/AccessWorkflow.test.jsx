// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessWorkflow } from './AccessWorkflow';

afterEach(() => cleanup());

const memberA = {
  id: 'CMBI-3001',
  name: 'Carla Ibarra',
  phone: '664 555 3001',
  age: 30,
  plan: 'Activo',
  services: ['alberca', 'gimnasio'],
  expiry: '2099-12-31',
};

const memberB = {
  id: 'CMBI-3002',
  name: 'Diego Ponce',
  phone: '664 555 3002',
  age: 27,
  plan: 'Integral',
  services: ['gimnasio', 'sauna', 'therapy'],
  expiry: '2099-12-31',
};

const expiredMember = {
  id: 'CMBI-3003',
  name: 'Elsa Ríos',
  phone: '664 555 3003',
  age: 55,
  plan: 'Esencial',
  services: ['gimnasio'],
  expiry: '2000-01-01',
};

describe('AccessWorkflow', () => {
  it('muestra un estado vacío cuando no hay ningún miembro seleccionado', () => {
    render(<AccessWorkflow members={[]} onCheckIn={vi.fn()} onToast={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Busca un miembro' })).toBeTruthy();
  });

  it('muestra las coincidencias de búsqueda y permite elegir un miembro distinto', async () => {
    const user = userEvent.setup();
    render(<AccessWorkflow members={[memberA, memberB]} initialMember={memberA} onCheckIn={vi.fn()} onToast={vi.fn()} />);

    const input = screen.getByLabelText('ID, teléfono o nombre');
    await user.clear(input);
    await user.type(input, 'Diego');

    const suggestion = screen.getByRole('button', { name: /Diego Ponce/ });
    await user.click(suggestion);

    expect(input.value).toBe('Diego Ponce');
    expect(screen.getByRole('heading', { name: 'Diego Ponce' })).toBeTruthy();
  });

  it('cambia automáticamente el servicio seleccionado si el nuevo miembro no lo incluye', async () => {
    const user = userEvent.setup();
    render(<AccessWorkflow members={[memberA, memberB]} initialMember={memberA} onCheckIn={vi.fn()} onToast={vi.fn()} />);

    // El servicio por omisión es "alberca", que memberB no tiene contratado.
    const input = screen.getByLabelText('ID, teléfono o nombre');
    await user.clear(input);
    await user.type(input, 'Diego');
    await user.click(screen.getByRole('button', { name: /Diego Ponce/ }));

    expect(screen.getByRole('button', { name: 'Gimnasio' }).className).toContain('selected');
    expect(screen.getByRole('button', { name: 'Alberca' }).className).not.toContain('selected');
  });

  it('muestra el estado de membresía vencida cuando corresponde', () => {
    render(<AccessWorkflow members={[expiredMember]} initialMember={expiredMember} onCheckIn={vi.fn()} onToast={vi.fn()} />);
    expect(screen.getByText('Membresía vencida')).toBeTruthy();
  });

  it('avisa con un error si se busca sin escribir nada y no hay miembro activo', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    render(<AccessWorkflow members={[]} onCheckIn={vi.fn()} onToast={onToast} />);

    const input = screen.getByLabelText('ID, teléfono o nombre');
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Buscar miembro' }));

    expect(onToast).toHaveBeenCalledWith('Escribe el nombre, teléfono o ID de un miembro.', 'error');
  });

  it('no muestra ningún error al buscar de nuevo sin cambiar la selección actual', async () => {
    const user = userEvent.setup();
    const onToast = vi.fn();
    render(<AccessWorkflow members={[memberA]} initialMember={memberA} onCheckIn={vi.fn()} onToast={onToast} />);

    await user.click(screen.getByRole('button', { name: 'Buscar miembro' }));

    expect(onToast).not.toHaveBeenCalled();
  });

  it('muestra un aviso de error cuando el registro de entrada falla', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn().mockResolvedValue({ ok: false, message: 'El miembro ya tiene una sesión activa.' });
    const onToast = vi.fn();
    const onTicket = vi.fn();
    render(<AccessWorkflow members={[memberA]} initialMember={memberA} onCheckIn={onCheckIn} onToast={onToast} onTicket={onTicket} />);

    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('El miembro ya tiene una sesión activa.', 'error'));
    expect(onTicket).not.toHaveBeenCalled();
  });

  it('notifica el locker asignado tras un registro exitoso que no es Therapy', async () => {
    const user = userEvent.setup();
    const onCheckIn = vi.fn().mockResolvedValue({ ok: true, session: { service: 'alberca', locker: 'A-05' } });
    const onToast = vi.fn();
    render(<AccessWorkflow members={[memberA]} initialMember={memberA} onCheckIn={onCheckIn} onToast={onToast} />);

    await user.click(screen.getByRole('button', { name: 'Registrar entrada' }));

    await waitFor(() => expect(onToast).toHaveBeenCalledWith('Entrada registrada. Locker A-05.', 'success'));
  });
});