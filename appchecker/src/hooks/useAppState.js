import { useCallback, useEffect, useRef, useState } from 'react';
import { allocateLocker, releaseLocker, validateCheckIn } from '../lib/domain';
import { loadState, resetDatabase, saveState } from '../lib/db';

export function useAppState(user) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const stateRef = useRef(null);

  useEffect(() => {
    loadState().then((stored) => {
      stateRef.current = stored;
      setState(stored);
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

  const checkIn = useCallback(async (member, service) => {
    const validationError = validateCheckIn({ member, service, sessions: state.sessions });
    if (validationError) return { ok: false, message: validationError };

    const allocation = allocateLocker(state.lockers, service, member.id);
    const session = {
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      service,
      checkIn: new Date().toISOString(),
      checkOut: null,
      duration: null,
      locker: allocation.lockerId,
      ticketId: `TKT-${Date.now()}`,
    };

    await commit((current) => ({
      ...current,
      lockers: allocation.lockers,
      sessions: [session, ...current.sessions],
      audit: [auditEntry('CHECK_IN', { memberId: member.id, service, locker: allocation.lockerId }), ...current.audit],
    }));

    return { ok: true, session };
  }, [auditEntry, commit, state]);

  const checkOut = useCallback(async (sessionId) => {
    const session = state.sessions.find((item) => item.id === sessionId);
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
    return { ok: true, duration };
  }, [auditEntry, commit, state]);

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
  }, [auditEntry, commit]);

  const deleteMember = useCallback(async (memberId) => {
    if (state.sessions.some((session) => session.memberId === memberId && !session.checkOut)) {
      return { ok: false, message: 'Registra la salida antes de eliminar al miembro.' };
    }
    await commit((current) => ({
      ...current,
      members: current.members.filter((member) => member.id !== memberId),
      audit: [auditEntry('MEMBER_DELETED', { memberId }), ...current.audit],
    }));
    return { ok: true };
  }, [auditEntry, commit, state]);

  const toggleLocker = useCallback(async (lockerId) => {
    const locker = state.lockers.find((item) => item.id === lockerId);
    if (!locker || locker.status === 'occupied') return false;
    await commit((current) => ({
      ...current,
      lockers: current.lockers.map((item) => item.id === lockerId
        ? { ...item, status: item.status === 'maintenance' ? 'free' : 'maintenance' }
        : item),
      audit: [auditEntry('LOCKER_STATUS', { lockerId }), ...current.audit],
    }));
    return true;
  }, [auditEntry, commit, state]);

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
    resetDemo,
  };
}
