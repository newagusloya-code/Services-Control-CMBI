import { useMemo, useState } from 'react';
import {
  Bell,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleDollarSign,
  DoorOpen,
  Dumbbell,
  LockKeyhole,
  LogOut,
  Menu,
  Search,
  Users,
  X,
} from 'lucide-react';
import { NAV_ITEMS } from '../config';
import { canAccess } from '../lib/domain';
import { BrandMark } from './BrandMark';

const NAV_ICONS = {
  dashboard: ChartNoAxesColumnIncreasing,
  checkin: DoorOpen,
  members: Users,
  lockers: LockKeyhole,
  reports: Dumbbell,
  finance: CircleDollarSign,
};

export function AppShell({ user, page, setPage, members, onSelectMember, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const visibleNav = NAV_ITEMS.filter((item) => canAccess(user.role, item.minimumRole));
  const matches = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('es');
    if (!normalized) return [];
    return members.filter((member) =>
      `${member.name} ${member.id} ${member.phone}`.toLocaleLowerCase('es').includes(normalized),
    ).slice(0, 5);
  }, [members, query]);

  const selectPage = (id) => {
    setPage(id);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <BrandMark />
          <span>CheckSport</span>
          <button className="sidebar-close icon-button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" title="Cerrar menú">
            <X size={20} />
          </button>
        </div>
        <nav aria-label="Navegación principal">
          {visibleNav.map((item) => {
            const Icon = NAV_ICONS[item.id];
            return (
              <button
                key={item.id}
                className={page === item.id ? 'nav-item active' : 'nav-item'}
                onClick={() => selectPage(item.id)}
              >
                <Icon size={21} strokeWidth={1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <button className="nav-item sidebar-settings" onClick={onLogout}>
          <LogOut size={20} strokeWidth={1.8} />
          <span>Salir</span>
        </button>
      </aside>

      {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" />}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <button className="mobile-menu icon-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menú" title="Abrir menú">
              <Menu size={23} />
            </button>
            <h1>{page === 'dashboard' ? 'Control de acceso' : NAV_ITEMS.find((item) => item.id === page)?.label}</h1>
          </div>
          <div className="global-search">
            <Search size={19} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar miembro"
              aria-label="Buscar miembro"
            />
            {query && (
              <div className="search-results">
                {matches.length ? matches.map((member) => (
                  <button key={member.id} onClick={() => {
                    onSelectMember(member);
                    setQuery('');
                    selectPage('checkin');
                  }}>
                    <span>{member.name}</span>
                    <small>{member.id}</small>
                  </button>
                )) : <p>Sin coincidencias</p>}
              </div>
            )}
          </div>
          <button className="topbar-icon icon-button" aria-label="Notificaciones" title="Notificaciones">
            <Bell size={21} />
            <span className="notification-dot" />
          </button>
          <div className="profile-wrap">
            <button className="profile-button" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen} aria-label={`Perfil de ${user.name}`}>
              <span className="avatar">{user.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
              <span className="profile-copy"><strong>{user.name}</strong><small>{user.role}</small></span>
              <ChevronDown size={17} />
            </button>
            {profileOpen && (
              <div className="profile-menu">
                <div><strong>Modo local</strong><small>Datos en este navegador</small></div>
                <button onClick={onLogout}><LogOut size={17} /> Cerrar sesión</button>
              </div>
            )}
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
