// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from './Login';

afterEach(() => cleanup());

describe('Login', () => {
  it('inicia sesión con las credenciales de demostración precargadas', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'supervisor', role: 'supervisor' }),
    );
  });

  it('muestra un error y no inicia sesión con credenciales inválidas', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.clear(screen.getByLabelText('Usuario'));
    await user.type(screen.getByLabelText('Usuario'), 'supervisor');
    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'incorrecta');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(screen.getByRole('alert').textContent).toContain('Usuario o contraseña incorrectos.');
    expect(onLogin).not.toHaveBeenCalled();
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

  it('completa el formulario y permite iniciar sesión con un perfil de demostración', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.click(screen.getByRole('button', { name: 'recepcionrecepcion' }));
    expect(screen.getByLabelText('Usuario').value).toBe('recepcion');
    expect(screen.getByLabelText('Contraseña').value).toBe('recep123');

    await user.click(screen.getByRole('button', { name: /Entrar/ }));
    expect(onLogin).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'recepcion', role: 'recepcion' }),
    );
  });

  it('limpia el mensaje de error después de un intento exitoso', async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} />);

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'mala-clave');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));
    expect(screen.getByRole('alert')).toBeTruthy();

    await user.clear(screen.getByLabelText('Contraseña'));
    await user.type(screen.getByLabelText('Contraseña'), 'super123');
    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});