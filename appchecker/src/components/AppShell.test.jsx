// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from './AppShell';

afterEach(() => cleanup());

const members = [
  { id: 'CMBI-2001', name: 'Ana López', phone: '664 555 2001' },
  { id: 'CMBI-2002', name: 'Beto Salas', phone: '664 555 2002' },
];

const recepcionUser = { username: 'recepcion', name: 'Sofía Reyes', role: 'recepcion' };
const gerenciaUser = { username: 'admin', name: 'Gerencia CMBI', role: 'gerencia' };

const renderShell = (overrides = {}) => {
  const props = {
    user: recepcionUser,
    page: 'dashboard',
    setPage: vi.fn(),
    members,
    onSelectMember: vi.fn(),
    onLogout: vi.fn(),
    children: <p>Contenido</p>,
    ...overrides,
  };
  render(<AppShell {...props}>{props.children}</AppShell>);
  return props;
};

describe('AppShell', () => {
  it('muestra solo la navegación permitida para el rol de recepción', () => {
    renderShell({ user: recepcionUser });
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    expect(within(nav).getByText('Resumen')).toBeTruthy();
    expect(within(nav).getByText('Entradas')).toBeTruthy();
    expect(within(nav).getByText('Miembros')).toBeTruthy();
    expect(within(nav).queryByText('Ingresos')).toBeNull();
    expect(within(nav).queryByText('Configuración')).toBeNull();
    expect(within(nav).queryByText('Lockers')).toBeNull();
  });

  it('muestra toda la navegación para el rol de gerencia', () => {
    renderShell({ user: gerenciaUser });
    const nav = screen.getByRole('navigation', { name: 'Navegación principal' });
    ['Resumen', 'Entradas', 'Miembros', 'Lockers', 'Reportes', 'Ingresos', 'Configuración'].forEach((label) => {
      expect(within(nav).getByText(label)).toBeTruthy();
    });
  });

  it('llama a setPage con el id correspondiente al hacer clic en un elemento de navegación', async () => {
    const user = userEvent.setup();
    const setPage = renderShell().setPage;
    await user.click(screen.getByRole('button', { name: /Miembros/ }));
    expect(setPage).toHaveBeenCalledWith('members');
  });

  it('llama a onLogout desde el botón "Salir" de la barra lateral', async () => {
    const user = userEvent.setup();
    const onLogout = renderShell().onLogout;
    await user.click(screen.getByRole('button', { name: /Salir/ }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('muestra "Control de acceso" como título cuando la página activa es el dashboard', () => {
    renderShell({ page: 'dashboard' });
    expect(screen.getByRole('heading', { name: 'Control de acceso' })).toBeTruthy();
  });

  it('usa la etiqueta del elemento de navegación como título para otras páginas', () => {
    renderShell({ page: 'members', user: gerenciaUser });
    expect(screen.getByRole('heading', { name: 'Miembros' })).toBeTruthy();
  });

  it('busca miembros globalmente y selecciona uno de los resultados', async () => {
    const user = userEvent.setup();
    const props = renderShell();
    await user.type(screen.getByLabelText('Buscar miembro'), 'Ana');

    const match = screen.getByRole('button', { name: /Ana López/ });
    await user.click(match);

    expect(props.onSelectMember).toHaveBeenCalledWith(members[0]);
    expect(props.setPage).toHaveBeenCalledWith('checkin');
    expect(screen.getByLabelText('Buscar miembro').value).toBe('');
  });

  it('muestra "Sin coincidencias" cuando ningún miembro coincide con la búsqueda', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.type(screen.getByLabelText('Buscar miembro'), 'Zzz-inexistente');
    expect(screen.getByText('Sin coincidencias')).toBeTruthy();
  });

  it('alterna el menú de perfil y cierra sesión desde ahí', async () => {
    const user = userEvent.setup();
    const props = renderShell();
    const profileButton = screen.getByRole('button', { name: `Perfil de ${recepcionUser.name}` });
    expect(profileButton.getAttribute('aria-expanded')).toBe('false');

    await user.click(profileButton);
    expect(profileButton.getAttribute('aria-expanded')).toBe('true');

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    expect(props.onLogout).toHaveBeenCalledTimes(1);
  });

  it('abre y cierra el menú móvil desde los controles de la barra lateral', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell user={recepcionUser} page="dashboard" setPage={vi.fn()} members={members} onSelectMember={vi.fn()} onLogout={vi.fn()}>
        <p>Contenido</p>
      </AppShell>,
    );

    const sidebar = container.querySelector('.sidebar');
    expect(sidebar.className).not.toContain('sidebar-open');
    expect(container.querySelector('.sidebar-scrim')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(sidebar.className).toContain('sidebar-open');
    expect(container.querySelector('.sidebar-scrim')).not.toBeNull();

    await user.click(container.querySelector('.sidebar-close'));
    expect(sidebar.className).not.toContain('sidebar-open');
  });

  it('cierra el menú móvil al hacer clic en el fondo (scrim)', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AppShell user={recepcionUser} page="dashboard" setPage={vi.fn()} members={members} onSelectMember={vi.fn()} onLogout={vi.fn()}>
        <p>Contenido</p>
      </AppShell>,
    );

    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    const sidebar = container.querySelector('.sidebar');
    expect(sidebar.className).toContain('sidebar-open');

    await user.click(container.querySelector('.sidebar-scrim'));
    expect(sidebar.className).not.toContain('sidebar-open');
  });

  it('renderiza el contenido hijo dentro del área principal', () => {
    renderShell({ children: <p>Vista de prueba</p> });
    expect(screen.getByText('Vista de prueba')).toBeTruthy();
  });
});