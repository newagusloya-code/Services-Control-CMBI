// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEMO_USERS } from '../config';
import { Login } from './Login';

afterEach(() => cleanup());

describe('Login', () => {
  it('precarga las credenciales de supervisor y permite iniciar sesión sin escribir nada', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    expect(screen.getByLabelText('Usuario').value).toBe('supervisor');
    expect(screen.getByLabelText('Contraseña').value).toBe('super123');

    await user.click(screen.getByRole('button', { name: /Entrar/ }));
    expect(onLogin).toHaveBeenCalledWith(DEMO_USERS.find((item) => item.username === 'supervisor'));
  });

  it('muestra un error y no inicia sesión con credenciales incorrectas', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'clave-incorrecta');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(screen.getByRole('alert').textContent).toBe('Usuario o contraseña incorrectos.');
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('ignora espacios alrededor del usuario antes de validar', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.clear(screen.getByLabelText('Usuario'));
    await user.type(screen.getByLabelText('Usuario'), '  supervisor  ');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(onLogin).toHaveBeenCalledWith(DEMO_USERS.find((item) => item.username === 'supervisor'));
  });

  it('rellena usuario y contraseña al elegir un perfil de demostración', async () => {
    const user = userEvent.setup();
    const admin = DEMO_USERS.find((item) => item.username === 'admin');
    render(<Login onLogin={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: new RegExp(admin.role, 'i') }));

    expect(screen.getByLabelText('Usuario').value).toBe('admin');
    expect(screen.getByLabelText('Contraseña').value).toBe('admin123');
  });

  it('alterna la visibilidad de la contraseña', async () => {
    const user = userEvent.setup();
    render(<Login onLogin={vi.fn()} />);

    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput.type).toBe('password');

    await user.click(screen.getByRole('button', { name: 'Mostrar u ocultar contraseña' }));
    expect(passwordInput.type).toBe('text');

    await user.click(screen.getByRole('button', { name: 'Mostrar u ocultar contraseña' }));
    expect(passwordInput.type).toBe('password');
  });

  it('limpia el error previo tras un intento exitoso posterior', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'clave-mala');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));
    expect(screen.getByRole('alert')).toBeTruthy();

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'super123');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});