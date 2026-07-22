import { useCallback, useEffect, useRef, useState } from 'react';
import {
  allocateSessionResource,
  releaseLocker,
  therapyPriceFor,
  validateCheckIn,
  validateTherapyDetails,
} from '../lib/domain';
import {
  backupIsDue,
  configureBackups,
  createBackupPackage,
  getBackupStatus,
  loadState,
  resetDatabase,
  restoreBackupPackage,
  saveState,
} from '../lib/db';
import { downloadJson } from '../lib/download';

export function useAppState(user) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const stateRef = useRef(null);

  useEffect(() => {
    loadState().then(async (stored) => {
      let current = stored;
      if (backupIsDue(stored.settings)) {
        try {
          const backup = await createBackupPackage(stored);
          current = {
            ...stored,
            settings: { ...stored.settings, lastBackupAt: backup.createdAt },
          };
          await saveState(current);
          downloadJson(backup, `service-control-cmbi-respaldo-${backup.createdAt.slice(0, 10)}.json`);
        } catch (backupError) {
          if (backupError.message !== 'BACKUP_NOT_CONFIGURED') setError('No fue posible generar el respaldo programado.');
        }
      }
      stateRef.current = current;
      setState(current);
    }).catch(() => setError('No fue posible abrir la base local.'));
  }, []);

  const commit = useCallback(async (producer) => {
    const saved = producer(stateRef.current);
    stateRef.current = saved;
    setState(saved);
    try {
      await saveState(saved);
      return saved;
    } catch {
      setError('El cambio no pudo guardarse en este dispositivo.');
      throw new Error('Persistence failed');
    }
  }, []);

  const auditEntry = useCallback((action, details = {}) => ({
    id: crypto.randomUUID(),
    action,
    details,
    user: user?.username ?? 'system',
    timestamp: new Date().toISOString(),
  }), [user]);

  const checkIn = useCallback(async (member, service, details = {}) => {
    const current = stateRef.current;
    const validationError = validateCheckIn({ member, service, sessions: current.sessions })
      ?? validateTherapyDetails(service, details.therapyType);
    if (validationError) return { ok: false, message: validationError };

    const allocation = allocateSessionResource({
      lockers: current.lockers,
      sessions: current.sessions,
      service,
      memberId: member.id,
    });
    if (!allocation.resourceId) return { ok: false, message: 'No hay un espacio disponible para este servicio.' };
    const session = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      service,
      checkIn: new Date().toISOString(),
      checkOut: null,
      duration: null,
      locker: allocation.locker ?? null,
      room: allocation.room ?? null,
      therapyType: service === 'therapy' ? details.therapyType.trim() : null,
      amount: service === 'therapy' ? therapyPriceFor(current.settings.therapyPrices, details.therapyType) : 0,
      ticketId: `TKT-${Date.now()}`,
    };

    await commit((current) => ({
      ...current,
      lockers: allocation.lockers,
      sessions: [session, ...current.sessions],
      audit: [auditEntry('CHECK_IN', { memberId: member.id, service, assignment: allocation.resourceId }), ...current.audit],
    }));

    return { ok: true, session };
  }, [auditEntry, commit]);

  const checkOut = useCallback(async (sessionId) => {
    const session = stateRef.current.sessions.find((item) => item.id === sessionId);
    if (!session || session.checkOut) return { ok: false, message: 'La sesión ya no está activa.' };
    const checkOutAt = new Date();
    const duration = Math.max(1, Math.round((checkOutAt - new Date(session.checkIn)) / 60_000));

    await commit((current) => ({
      ...current,
      lockers: releaseLocker(current.lockers, session.locker),
      sessions: current.sessions.map((item) => item.id === sessionId ? {
        ...item,
        checkOut: checkOutAt.toISOString(),
        duration,
      } : item),
      audit: [auditEntry('CHECK_OUT', { sessionId, duration }), ...current.audit],
    }));
    return { ok: true, duration, session: { ...session, checkOut: checkOutAt.toISOString(), duration } };
  }, [auditEntry, commit]);

  const saveMember = useCallback(async (member) => {
    await commit((current) => {
      const exists = current.members.some((item) => item.id === member.id);
      return {
        ...current,
        members: exists
          ? current.members.map((item) => item.id === member.id ? member : item)
          : [member, ...current.members],
        audit: [auditEntry(exists ? 'MEMBER_UPDATED' : 'MEMBER_CREATED', { memberId: member.id }), ...current.audit],
      };
    });
    return member;
  }, [auditEntry, commit]);

  const deleteMember = useCallback(async (memberId) => {
    if (stateRef.current.sessions.some((session) => session.memberId === memberId && !session.checkOut)) {
      return { ok: false, message: 'Registra la salida antes de eliminar al miembro.' };
    }
    await commit((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== memberId),
      audit: [auditEntry('MEMBER_DELETED', { memberId }), ...current.audit],
    }));
    return { ok: true };
  }, [auditEntry, commit]);

  const toggleLocker = useCallback(async (lockerId) => {
    const locker = stateRef.current.lockers.find((item) => item.id === lockerId);
    if (!locker || locker.status === 'occupied') return false;
    await commit((current) => ({
      ...current,
      lockers: current.lockers.map((item) => item.id === lockerId
        ? { ...item, status: item.status === 'maintenance' ? 'free' : 'maintenance' }
        : item),
      audit: [auditEntry('LOCKER_STATUS', { lockerId }), ...current.audit],
    }));
    return true;
  }, [auditEntry, commit]);

  const saveSettings = useCallback(async (settings) => {
    await commit((current) => ({
      ...current,
      settings: { ...current.settings, ...settings },
      audit: [auditEntry('SETTINGS_UPDATED', { keys: Object.keys(settings) }), ...current.audit],
    }));
  }, [auditEntry, commit]);

  const prepareBackups = useCallback(async (password) => {
    await configureBackups(password);
    return getBackupStatus();
  }, []);

  const createBackup = useCallback(async () => {
    const backup = await createBackupPackage(stateRef.current);
    const updated = {
      ...stateRef.current,
      settings: { ...stateRef.current.settings, lastBackupAt: backup.createdAt },
    };
    await saveState(updated);
    stateRef.current = updated;
    setState(updated);
    downloadJson(backup, `service-control-cmbi-respaldo-${backup.createdAt.slice(0, 10)}.json`);
    return backup;
  }, []);

  const restoreBackup = useCallback(async (backup, password) => {
    const restored = await restoreBackupPackage(backup, password);
    stateRef.current = restored;
    setState(restored);
    return restored;
  }, []);

  const resetDemo = useCallback(async () => {
    const fresh = await resetDatabase();
    stateRef.current = fresh;
    setState(fresh);
  }, []);

  return {
    state,
    error,
    clearError: () => setError(''),
    checkIn,
    checkOut,
    saveMember,
    deleteMember,
    toggleLocker,
    saveSettings,
    prepareBackups,
    createBackup,
    restoreBackup,
    getBackupStatus,
    resetDemo,
  };
}
