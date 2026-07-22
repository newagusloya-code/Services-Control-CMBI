import { describe, expect, it } from 'vitest';
import { allocateLocker, getSessionStatus, validateCheckIn } from './domain';

const member = {
  id: 'M-1',
  plan: 'Activo',
  services: ['gimnasio'],
  expiry: '2099-12-31',
};

describe('reglas de acceso', () => {
  it('rechaza servicios fuera del plan', () => {
    expect(validateCheckIn({ member, service: 'sauna', sessions: [] })).toContain('no incluye Sauna');
  });

  it('rechaza una segunda sesión activa', () => {
    const sessions = [{ memberId: 'M-1', service: 'gimnasio', checkOut: null }];
    expect(validateCheckIn({ member, service: 'gimnasio', sessions })).toContain('sesión activa');
  });

  it('asigna el primer locker libre del servicio', () => {
    const lockers = [
      { id: 'G-01', status: 'occupied', memberId: 'M-2' },
      { id: 'G-02', status: 'free', memberId: null },
      { id: 'A-01', status: 'free', memberId: null },
    ];
    const result = allocateLocker(lockers, 'gimnasio', 'M-1');
    expect(result.lockerId).toBe('G-02');
    expect(result.lockers[1]).toMatchObject({ status: 'occupied', memberId: 'M-1' });
  });

  it('marca como excedida una sesión fuera del límite', () => {
    const checkIn = new Date(Date.now() - 100 * 60_000).toISOString();
    expect(getSessionStatus({ service: 'gimnasio', checkIn }).tone).toBe('danger');
  });
});
