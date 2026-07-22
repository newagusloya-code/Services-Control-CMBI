import { describe, expect, it } from 'vitest';
import {
  allocateLocker,
  allocateSessionResource,
  csvEscape,
  generateMemberId,
  getSessionStatus,
  sessionPrice,
  validateCheckIn,
  validateTherapyDetails,
} from './domain';

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

  it('limita Sauna a dos sesiones concurrentes', () => {
    const saunaMember = { ...member, id: 'M-3', plan: 'Integral', services: ['sauna'] };
    const sessions = [
      { memberId: 'M-1', service: 'sauna', checkOut: null },
      { memberId: 'M-2', service: 'sauna', checkOut: null },
    ];
    expect(validateCheckIn({ member: saunaMember, service: 'sauna', sessions })).toContain('capacidad máxima');
  });

  it('asigna un consultorio distinto a cada sesión de Therapy', () => {
    const sessions = [
      { memberId: 'M-1', service: 'therapy', room: 'Ruby', checkOut: null },
      { memberId: 'M-2', service: 'therapy', room: 'Topacio', checkOut: null },
    ];
    const result = allocateSessionResource({ lockers: [], sessions, service: 'therapy', memberId: 'M-3' });
    expect(result.room).toBe('Onyx');
    const full = allocateSessionResource({
      lockers: [],
      sessions: [...sessions, { memberId: 'M-3', service: 'therapy', room: 'Onyx', checkOut: null }],
      service: 'therapy',
      memberId: 'M-4',
    });
    expect(full.room).toBeNull();
  });

  it('requiere una descripción libre para Therapy', () => {
    expect(validateTherapyDetails('therapy', '  ')).toContain('terapia');
    expect(validateTherapyDetails('therapy', 'Masaje relajante')).toBeNull();
  });

  it('genera IDs CMBI sin duplicados', () => {
    expect(generateMemberId([{ id: 'CMBI-0042' }], 42)).toBe('CMBI-0043');
  });

  it('escapa correctamente un CSV con separador de Excel', () => {
    expect(csvEscape('Masaje; facial', ';')).toBe('"Masaje; facial"');
  });

  it('refleja el precio vigente de Therapy en los cálculos', () => {
    const session = { service: 'therapy', therapyType: 'Masaje relajante', amount: 100 };
    const settings = { therapyPrices: { 'masaje relajante': { label: 'Masaje relajante', price: 650 } } };
    expect(sessionPrice(session, settings)).toBe(650);
  });
});
