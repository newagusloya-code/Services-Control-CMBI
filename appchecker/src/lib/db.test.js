import { describe, expect, it } from 'vitest';
import { backupIsDue, migrateState } from './db';

describe('migración del estado local', () => {
  it('elimina correo, agrega Therapy y reduce Sauna a dos lockers', () => {
    const migrated = migrateState({
      version: 1,
      members: [{ id: 'CMBI-1', name: 'Ana', email: 'ana@example.test', plan: 'Integral', services: ['sauna'], expiry: '2099-12-31' }],
      sessions: [],
      lockers: Array.from({ length: 8 }, (_, index) => ({ id: `S-${String(index + 1).padStart(2, '0')}`, status: 'free', memberId: null })),
      settings: {},
      audit: [],
    });

    expect(migrated.version).toBe(3);
    expect(migrated.members[0]).not.toHaveProperty('email');
    expect(migrated.members[0].services).toContain('therapy');
    expect(migrated.lockers.filter((locker) => locker.id.startsWith('S-'))).toHaveLength(2);
  });

  it('marca como vencido un respaldo diario después de 24 horas', () => {
    const now = new Date('2026-07-22T12:00:00Z').getTime();
    expect(backupIsDue({ backupSchedule: 'daily', lastBackupAt: '2026-07-21T11:59:00Z' }, now)).toBe(true);
    expect(backupIsDue({ backupSchedule: 'daily', lastBackupAt: '2026-07-22T11:59:00Z' }, now)).toBe(false);
  });
});
