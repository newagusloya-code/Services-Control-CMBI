import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { useAppState } from './hooks/useAppState';
import { CheckInView } from './views/CheckInView';
import { DashboardView } from './views/DashboardView';
import { FinanceView } from './views/FinanceView';
import { LockersView } from './views/LockersView';
import { MembersView } from './views/MembersView';
import { ReportsView } from './views/ReportsView';

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem('checksport-user'));
  } catch {
    return null;
  }
};

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [page, setPage] = useState('dashboard');
  const [selectedMember, setSelectedMember] = useState(null);
  const [toast, setToast] = useState(null);
  const app = useAppState(user);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (app.error) setToast({ message: app.error, tone: 'error' });
  }, [app.error]);

  const notify = (message, tone = 'success') => setToast({ message, tone });

  const login = (nextUser) => {
    const safeUser = { username: nextUser.username, name: nextUser.name, role: nextUser.role };
    sessionStorage.setItem('checksport-user', JSON.stringify(safeUser));
    setUser(safeUser);
  };

  const logout = () => {
    sessionStorage.removeItem('checksport-user');
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <Login onLogin={login} />;
  if (!app.state) return <div className="app-loading"><span className="loading-mark">CS</span><p>Preparando control de acceso...</p></div>;

  const view = {
    dashboard: <DashboardView state={app.state} initialMember={selectedMember} onCheckIn={app.checkIn} onCheckOut={app.checkOut} onToast={notify} onOpenReports={() => setPage('reports')} />,
    checkin: <CheckInView state={app.state} initialMember={selectedMember} onCheckIn={app.checkIn} onCheckOut={app.checkOut} onToast={notify} />,
    members: <MembersView members={app.state.members} onSave={app.saveMember} onDelete={app.deleteMember} onToast={notify} />,
    lockers: <LockersView lockers={app.state.lockers} onToggle={app.toggleLocker} onToast={notify} />,
    reports: <ReportsView sessions={app.state.sessions} onToast={notify} />,
    finance: <FinanceView currentUser={user} onToast={notify} />,
  }[page];

  return (
    <>
      <AppShell user={user} page={page} setPage={setPage} members={app.state.members} onSelectMember={setSelectedMember} onLogout={logout}>
        {view}
      </AppShell>
      <Toast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
