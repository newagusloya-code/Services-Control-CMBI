// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDatabase } from './lib/db';
import App from './App';

afterEach(() => cleanup());

const recepcionUser = { username: 'recepcion', name: 'Sofía Reyes', role: 'recepcion' };

describe('App', () => {
  beforeEach(async () => {
    await resetDatabase();
    sessionStorage.clear();
  });

  it('muestra la pantalla de inicio de sesión cuando no hay usuario almacenado', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
  });

  it('muestra un estado de carga mientras se abre la base local para un usuario ya autenticado', () => {
    sessionStorage.setItem('service-control-cmbi-user', JSON.stringify(recepcionUser));
    render(<App />);
    expect(screen.getByText('Preparando control de servicios...')).toBeTruthy();
  });

  it('recupera la sesión desde la clave heredada "checksport-user"', () => {
    sessionStorage.setItem('checksport-user', JSON.stringify(recepcionUser));
    render(<App />);
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).toBeNull();
    expect(screen.getByText('Preparando control de servicios...')).toBeTruthy();
  });

  it('inicia sesión con las credenciales de demostración y muestra el tablero principal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Control de acceso' })).toBeTruthy());
    const stored = JSON.parse(sessionStorage.getItem('service-control-cmbi-user'));
    expect(stored).toEqual({ username: 'supervisor', name: 'Adrián Salas', role: 'supervisor' });
  });

  it('no guarda la contraseña del usuario en el almacenamiento de sesión', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: /Entrar/ }));
    await waitFor(() => expect(sessionStorage.getItem('service-control-cmbi-user')).not.toBeNull());
    const stored = JSON.parse(sessionStorage.getItem('service-control-cmbi-user'));
    expect(stored).not.toHaveProperty('password');
  });

  it('limpia también la clave heredada al cerrar sesión', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('checksport-user', JSON.stringify(recepcionUser));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Control de acceso' })).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Salir/ }));
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(sessionStorage.getItem('checksport-user')).toBeNull();
  });

  it('cierra sesión, limpia el almacenamiento y regresa a la pantalla de acceso', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('service-control-cmbi-user', JSON.stringify(recepcionUser));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Control de acceso' })).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Salir/ }));

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy();
    expect(sessionStorage.getItem('service-control-cmbi-user')).toBeNull();
  });

  it('navega entre páginas usando la barra lateral', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem('service-control-cmbi-user', JSON.stringify(recepcionUser));
    render(<App />);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Control de acceso' })).toBeTruthy());

    await user.click(screen.getByRole('button', { name: /Miembros/ }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Miembros' })).toBeTruthy());
  });
});