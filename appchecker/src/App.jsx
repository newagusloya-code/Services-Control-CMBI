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
import { SettingsView } from './views/SettingsView';

const USER_STORAGE_KEY = 'service-control-cmbi-user';

const getStoredUser = () => {
  try {
    return JSON.parse(sessionStorage.getItem(USER_STORAGE_KEY) ?? sessionStorage.getItem('checksport-user'));
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
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(safeUser));
    sessionStorage.removeItem('checksport-user');
    setUser(safeUser);
  };

  const logout = () => {
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem('checksport-user');
    setUser(null);
    setPage('dashboard');
  };

  if (!user) return <Login onLogin={login} />;
  if (!app.state) return <div className="app-loading"><span className="loading-mark">SC</span><p>Preparando control de servicios...</p></div>;

  const view = {
    dashboard: <DashboardView state={app.state} initialMember={selectedMember} onCheckIn={app.checkIn} onCheckOut={app.checkOut} onToast={notify} onOpenReports={() => setPage('reports')} />,
    checkin: <CheckInView state={app.state} initialMember={selectedMember} onCheckIn={app.checkIn} onCheckOut={app.checkOut} onToast={notify} />,
    members: <MembersView members={app.state.members} onSave={app.saveMember} onDelete={app.deleteMember} onToast={notify} />,
    lockers: <LockersView lockers={app.state.lockers} onToggle={app.toggleLocker} onToast={notify} />,
    reports: <ReportsView sessions={app.state.sessions} settings={app.state.settings} onToast={notify} />,
    finance: <FinanceView currentUser={user} sessions={app.state.sessions} settings={app.state.settings} onToast={notify} />,
    settings: <SettingsView settings={app.state.settings} onSave={app.saveSettings} onPrepareBackups={app.prepareBackups} onCreateBackup={app.createBackup} onRestoreBackup={app.restoreBackup} onGetBackupStatus={app.getBackupStatus} onToast={notify} />,
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
