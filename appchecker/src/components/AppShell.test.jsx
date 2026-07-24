// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

afterEach(() => cleanup());

const members = [
  { id: 'CMBI-2001', name: 'Ana López', phone: '664 555 2001' },
  { id: 'CMBI-2002', name: 'Bruno Cano', phone: '664 555 2002' },
];

function renderShell({ role = 'gerencia', ...overrides } = {}) {
  const props = {
    user: { name: 'Adrián Salas', role },
    page: 'dashboard',
    setPage: vi.fn(),
    members,
    onSelectMember: vi.fn(),
    onLogout: vi.fn(),
    children: <div>contenido</div>,
    ...overrides,
  };
  const view = render(<AppShell {...props}>{props.children}</AppShell>);
  return { ...view, props };
}

describe('AppShell', () => {
  it('muestra únicamente los elementos de navegación permitidos para recepción', () => {
    renderShell({ role: 'recepcion' });
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy();
    ['Resumen', 'Entradas', 'Miembros'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    });
    ['Lockers', 'Reportes', 'Ingresos', 'Configuración'].forEach((label) => {
      expect(screen.queryByRole('button', { name: label })).toBeNull();
    });
  });

  it('muestra todos los elementos de navegación para gerencia', () => {
    renderShell({ role: 'gerencia' });
    ['Resumen', 'Entradas', 'Miembros', 'Lockers', 'Reportes', 'Ingresos', 'Configuración'].forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toBeTruthy();
    });
  });

  it('abre y cierra el menú móvil', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar.className).not.toContain('sidebar-open');

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(sidebar.className).toContain('sidebar-open');

    await user.click(within(sidebar).getByRole('button', { name: 'Cerrar menú' }));
    expect(sidebar.className).not.toContain('sidebar-open');
  });

  it('cierra el menú móvil al hacer clic en el fondo (scrim)', async () => {
    const user = userEvent.setup();
    const { container } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const scrim = container.querySelector('.sidebar-scrim');
    expect(scrim).toBeTruthy();

    await user.click(scrim);
    expect(container.querySelector('.sidebar').className).not.toContain('sidebar-open');
  });

  it('busca miembros y notifica la selección global', async () => {
    const user = userEvent.setup();
    const { props } = renderShell();

    await user.type(screen.getByLabelText('Buscar miembro'), 'Bruno');
    const result = await screen.findByRole('button', { name: /Bruno Cano/ });
    await user.click(result);

    expect(props.onSelectMember).toHaveBeenCalledWith(members[1]);
    expect(props.setPage).toHaveBeenCalledWith('checkin');
    expect(screen.getByLabelText('Buscar miembro').value).toBe('');
  });

  it('muestra "Sin coincidencias" cuando la búsqueda no encuentra miembros', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.type(screen.getByLabelText('Buscar miembro'), 'zzz-no-existe');
    expect(await screen.findByText('Sin coincidencias')).toBeTruthy();
  });

  it('alterna el menú de perfil y permite cerrar sesión', async () => {
    const user = userEvent.setup();
    const { props } = renderShell();

    await user.click(screen.getByRole('button', { name: /Perfil de Adrián Salas/ }));
    const logoutButton = screen.getByRole('button', { name: /Cerrar sesión/ });
    expect(logoutButton).toBeTruthy();

    await user.click(logoutButton);
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('marca como activo el elemento de navegación de la página actual', () => {
    renderShell({ page: 'members' });
    const activeButton = screen.getByRole('button', { name: 'Miembros' });
    expect(activeButton.className).toContain('active');
    const inactiveButton = screen.getByRole('button', { name: 'Resumen' });
    expect(inactiveButton.className).not.toContain('active');
  });

  it('cierra el menú móvil al seleccionar una página desde la barra lateral', async () => {
    const user = userEvent.setup();
    const { container, props } = renderShell();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));

    await user.click(screen.getByRole('button', { name: 'Miembros' }));

    expect(props.setPage).toHaveBeenCalledWith('members');
    expect(container.querySelector('.sidebar').className).not.toContain('sidebar-open');
  });
});