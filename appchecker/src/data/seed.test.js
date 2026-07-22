import { describe, expect, it } from 'vitest';
import { SERVICES } from '../config';
import { createSeedState } from './seed';

describe('estado inicial de demostración', () => {
  it('genera la forma completa del estado (versión, miembros, sesiones, lockers, auditoría y configuración)', () => {
    const state = createSeedState();
    expect(state.version).toBe(2);
    expect(Array.isArray(state.members)).toBe(true);
    expect(Array.isArray(state.sessions)).toBe(true);
    expect(Array.isArray(state.lockers)).toBe(true);
    expect(state.audit).toEqual([]);
    expect(state.settings).toEqual({
      sickarEndpoint: '',
      printerMode: 'browser',
      therapyPrices: {},
      backupSchedule: 'manual',
      lastBackupAt: null,
    });
  });

  it('crea seis miembros con ids únicos', () => {
    const { members } = createSeedState();
    expect(members).toHaveLength(6);
    expect(new Set(members.map((member) => member.id)).size).toBe(6);
  });

  it('incluye un miembro con vigencia vencida para probar los estados de membresía', () => {
    const { members } = createSeedState();
    const expired = members.find((member) => member.name === 'Elena Torres');
    expect(expired).toBeTruthy();
    expect(new Date(`${expired.expiry}T23:59:59`).getTime()).toBeLessThan(Date.now());
  });

  it('genera sesiones activas para varios miembros y sesiones históricas con salida registrada', () => {
    const { sessions } = createSeedState();
    // 5 sesiones base + 14 sesiones históricas generadas en el ciclo de 14 días.
    expect(sessions).toHaveLength(19);
    const active = sessions.filter((session) => !session.checkOut);
    expect(active).toHaveLength(4);
    const withHistory = sessions.filter((session) => session.checkOut);
    expect(withHistory).toHaveLength(15);
  });

  it('asigna ids únicos y fechas de entrada válidas a cada sesión', () => {
    const { sessions } = createSeedState();
    expect(new Set(sessions.map((session) => session.id)).size).toBe(sessions.length);
    sessions.forEach((session) => {
      expect(Number.isNaN(new Date(session.checkIn).getTime())).toBe(false);
    });
  });

  it('crea lockers únicamente para los servicios con lockerPrefix (no para Therapy)', () => {
    const { lockers } = createSeedState();
    const expectedCount = Object.values(SERVICES)
      .filter((service) => service.lockerPrefix)
      .reduce((total, service) => total + service.lockerCount, 0);
    expect(lockers).toHaveLength(expectedCount);
    expect(lockers.every((locker) => !locker.id.startsWith('therapy'))).toBe(true);
  });

  it('limita los lockers de Sauna a dos, en línea con su capacidad reducida', () => {
    const { lockers } = createSeedState();
    const saunaLockers = lockers.filter((locker) => locker.id.startsWith('S-'));
    expect(saunaLockers).toHaveLength(2);
  });

  it('marca como ocupados los lockers usados por las sesiones activas', () => {
    const { sessions, lockers } = createSeedState();
    const activeLockerIds = sessions.filter((session) => !session.checkOut).map((session) => session.locker);
    activeLockerIds.forEach((lockerId) => {
      const locker = lockers.find((item) => item.id === lockerId);
      expect(locker.status).toBe('occupied');
      expect(locker.memberId).toBeTruthy();
    });
  });

  it('deja libres los lockers que ninguna sesión activa está usando', () => {
    const { sessions, lockers } = createSeedState();
    const activeLockerIds = new Set(sessions.filter((session) => !session.checkOut).map((session) => session.locker));
    const untouched = lockers.filter((locker) => !activeLockerIds.has(locker.id));
    expect(untouched.length).toBeGreaterThan(0);
    untouched.forEach((locker) => {
      expect(locker.status).toBe('free');
      expect(locker.memberId).toBeNull();
    });
  });
});