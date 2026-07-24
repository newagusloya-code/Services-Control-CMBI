// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const useAppState = vi.hoisted(() => vi.fn());
vi.mock('./hooks/useAppState', () => ({ useAppState }));

vi.mock('./views/DashboardView', () => ({
  DashboardView: (props) => (
    <div data-testid="view-dashboard">
      Dashboard members: {props.state.members.length}
      <button onClick={() => props.onToast('mensaje de prueba')}>notify</button>
    </div>
  ),
}));
vi.mock('./views/CheckInView', () => ({ CheckInView: () => <div data-testid="view-checkin">Entradas</div> }));
vi.mock('./views/MembersView', () => ({ MembersView: () => <div data-testid="view-members">Miembros</div> }));
vi.mock('./views/LockersView', () => ({ LockersView: () => <div data-testid="view-lockers">Lockers</div> }));
vi.mock('./views/ReportsView', () => ({ ReportsView: () => <div data-testid="view-reports">Reportes</div> }));
vi.mock('./views/FinanceView', () => ({ FinanceView: () => <div data-testid="view-finance">Ingresos</div> }));
vi.mock('./views/SettingsView', () => ({ SettingsView: () => <div data-testid="view-settings">Configuración</div> }));

const USER_STORAGE_KEY = 'service-control-cmbi-user';

const baseAppReturn = () => ({
  state: {
    members: [{ id: 'CMBI-1', name: 'Test Uno', phone: '664 555 0001', services: ['alberca'], expiry: '2099-01-01' }],
    sessions: [],
    lockers: [],
    settings: {},
  },
  error: '',
  clearError: vi.fn(),
  checkIn: vi.fn(),
  checkOut: vi.fn(),
  saveMember: vi.fn(),
  deleteMember: vi.fn(),
  toggleLocker: vi.fn(),
  saveSettings: vi.fn(),
  prepareBackups: vi.fn(),
  createBackup: vi.fn(),
  restoreBackup: vi.fn(),
  getBackupStatus: vi.fn(),
  resetDemo: vi.fn(),
});

describe('App', () => {
  beforeEach(() => {
    useAppState.mockReset();
    useAppState.mockReturnValue(baseAppReturn());
    sessionStorage.clear();
  });

  afterEach(() => cleanup());

  it('muestra la pantalla de inicio de sesión cuando no hay usuario almacenado', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 2, name: 'Iniciar sesión' })).toBeTruthy();
    expect(screen.queryByTestId('view-dashboard')).toBeNull();
  });

  it('guarda el usuario en sessionStorage y muestra el tablero tras iniciar sesión', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /Entrar/ }));

    await waitFor(() => expect(screen.getByTestId('view-dashboard')).toBeTruthy());
    const stored = JSON.parse(sessionStorage.getItem(USER_STORAGE_KEY));
    expect(stored).toMatchObject({ username: 'supervisor', role: 'supervisor' });
  });

  it('restaura la sesión previa desde la clave actual de sessionStorage', () => {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    render(<App />);

    expect(screen.getByTestId('view-dashboard')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Perfil de Gerencia CMBI/ })).toBeTruthy();
  });

  it('recupera al usuario desde la clave heredada checksport-user', () => {
    sessionStorage.setItem('checksport-user', JSON.stringify({ username: 'recepcion', name: 'Sofía Reyes', role: 'recepcion' }));
    render(<App />);

    expect(screen.getByTestId('view-dashboard')).toBeTruthy();
    expect(screen.getByRole('button', { name: /Perfil de Sofía Reyes/ })).toBeTruthy();
  });

  it('muestra el estado de carga cuando el estado de la app aún no está disponible', () => {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    useAppState.mockReturnValue({ ...baseAppReturn(), state: null });

    render(<App />);

    expect(screen.getByText('Preparando control de servicios...')).toBeTruthy();
    expect(screen.queryByTestId('view-dashboard')).toBeNull();
  });

  it('cierra sesión, limpia sessionStorage y regresa al login', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Salir' }));

    expect(screen.getByRole('heading', { level: 2, name: 'Iniciar sesión' })).toBeTruthy();
    expect(sessionStorage.getItem(USER_STORAGE_KEY)).toBeNull();
  });

  it('cambia de vista al seleccionar una página distinta en el menú', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Miembros' }));

    expect(screen.getByTestId('view-members')).toBeTruthy();
    expect(screen.queryByTestId('view-dashboard')).toBeNull();
  });

  it('muestra un toast de error cuando el estado de la app reporta un error', async () => {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    useAppState.mockReturnValue({ ...baseAppReturn(), error: 'No fue posible abrir la base local.' });

    render(<App />);

    const status = await screen.findByRole('status');
    expect(status.textContent).toContain('No fue posible abrir la base local.');
  });

  it('oculta el toast automáticamente después del tiempo configurado', async () => {
    vi.useFakeTimers();
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' }));
    render(<App />);

    fireEvent.click(screen.getByText('notify'));
    expect(screen.getByRole('status').textContent).toContain('mensaje de prueba');

    act(() => {
      vi.advanceTimersByTime(3600);
    });

    expect(screen.queryByRole('status')).toBeNull();
    vi.useRealTimers();
  });
});