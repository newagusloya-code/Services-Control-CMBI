import { describe, expect, it } from 'vitest';
import { SERVICES } from '../config';
import { createSeedState } from './seed';

describe('createSeedState', () => {
  it('regresa la forma esperada del estado inicial', () => {
    const state = createSeedState();
    expect(state.version).toBe(2);
    expect(Array.isArray(state.members)).toBe(true);
    expect(Array.isArray(state.sessions)).toBe(true);
    expect(Array.isArray(state.lockers)).toBe(true);
    expect(state.audit).toEqual([]);
  });

  it('incluye configuración por defecto en settings', () => {
    const { settings } = createSeedState();
    expect(settings).toEqual({
      sickarEndpoint: '',
      printerMode: 'browser',
      therapyPrices: {},
      backupSchedule: 'manual',
      lastBackupAt: null,
    });
  });

  it('genera miembros únicos, incluyendo uno con membresía vencida', () => {
    const { members } = createSeedState();
    expect(members.length).toBeGreaterThan(0);

    const ids = members.map((member) => member.id);
    expect(new Set(ids).size).toBe(ids.length);

    const expired = members.find((member) => new Date(member.expiry) < new Date());
    expect(expired).toBeTruthy();
    expect(expired.name).toBe('Elena Torres');
  });

  it('cada miembro sólo tiene servicios contemplados en SERVICES', () => {
    const { members } = createSeedState();
    for (const member of members) {
      for (const service of member.services) {
        expect(Object.keys(SERVICES)).toContain(service);
      }
    }
  });

  it('genera sesiones iniciales más el histórico de 14 días', () => {
    const { sessions } = createSeedState();
    expect(sessions.length).toBe(19);

    const ids = sessions.map((session) => session.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('crea un locker por cada espacio configurado con lockerPrefix', () => {
    const { lockers } = createSeedState();
    const expectedTotal = Object.values(SERVICES)
      .filter((service) => service.lockerPrefix)
      .reduce((sum, service) => sum + service.lockerCount, 0);
    expect(lockers.length).toBe(expectedTotal);

    const saunaLockers = lockers.filter((locker) => locker.id.startsWith(`${SERVICES.sauna.lockerPrefix}-`));
    expect(saunaLockers).toHaveLength(SERVICES.sauna.lockerCount);
  });

  it('marca como ocupados sólo los lockers de sesiones activas', () => {
    const { sessions, lockers } = createSeedState();
    const openSessions = sessions.filter((session) => !session.checkOut);
    expect(openSessions.length).toBeGreaterThan(0);

    for (const session of openSessions) {
      const locker = lockers.find((item) => item.id === session.locker);
      expect(locker.status).toBe('occupied');
      expect(locker.memberId).toBe(session.memberId);
    }

    const occupiedIds = new Set(openSessions.map((session) => session.locker));
    const freeLockers = lockers.filter((locker) => !occupiedIds.has(locker.id));
    for (const locker of freeLockers) {
      expect(locker.status).toBe('free');
      expect(locker.memberId).toBeNull();
    }
  });

  it('produce estados independientes en cada llamada', () => {
    const first = createSeedState();
    const second = createSeedState();
    expect(first).not.toBe(second);
    expect(first.members).not.toBe(second.members);
    expect(first.sessions[0].id).not.toBe(second.sessions[0].id);

    first.lockers[0].status = 'occupied';
    expect(second.lockers[0].status).toBe('free');
  });
});