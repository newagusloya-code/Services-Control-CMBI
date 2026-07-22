import { describe, expect, it } from 'vitest';
import { APP_NAME, DEMO_USERS, NAV_ITEMS, PLAN_SERVICES, ROLE_LEVEL, SERVICES, THERAPY_ROOMS } from './config';

describe('config', () => {
  it('define el nombre de la aplicación', () => {
    expect(APP_NAME).toBe('Service Control CMBI');
  });

  it('define capacidad, límite de tiempo y asignación para cada servicio', () => {
    for (const [key, service] of Object.entries(SERVICES)) {
      expect(service.label).toBeTruthy();
      expect(service.capacity).toBeGreaterThan(0);
      expect(service.minutes).toBeGreaterThan(0);
      expect(['Locker', 'Consultorio']).toContain(service.assignmentLabel);
      if (key !== 'therapy') {
        expect(service.lockerPrefix).toBeTruthy();
        expect(service.lockerCount).toBeGreaterThan(0);
      }
    }
  });

  it('usa Consultorio como asignación para Therapy y expone sus salas', () => {
    expect(SERVICES.therapy.assignmentLabel).toBe('Consultorio');
    expect(SERVICES.therapy.rooms).toBe(THERAPY_ROOMS);
    expect(SERVICES.therapy.lockerPrefix).toBeUndefined();
  });

  it('THERAPY_ROOMS no tiene nombres duplicados', () => {
    expect(THERAPY_ROOMS.length).toBeGreaterThan(0);
    expect(new Set(THERAPY_ROOMS).size).toBe(THERAPY_ROOMS.length);
  });

  it('ROLE_LEVEL ordena los roles de menor a mayor privilegio', () => {
    expect(ROLE_LEVEL.recepcion).toBeLessThan(ROLE_LEVEL.supervisor);
    expect(ROLE_LEVEL.supervisor).toBeLessThan(ROLE_LEVEL.gerencia);
  });

  it('cada NAV_ITEM tiene un id, etiqueta y minimumRole válido', () => {
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
    for (const item of NAV_ITEMS) {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(Object.keys(ROLE_LEVEL)).toContain(item.minimumRole);
    }
  });

  it('no repite ids entre los elementos de navegación', () => {
    const ids = NAV_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('PLAN_SERVICES sólo referencia servicios definidos en SERVICES', () => {
    for (const services of Object.values(PLAN_SERVICES)) {
      expect(services.length).toBeGreaterThan(0);
      for (const service of services) {
        expect(Object.keys(SERVICES)).toContain(service);
      }
    }
  });

  it('el plan Integral incluye todos los servicios disponibles', () => {
    expect(new Set(PLAN_SERVICES.Integral)).toEqual(new Set(Object.keys(SERVICES)));
  });

  it('DEMO_USERS tiene usuarios únicos con rol válido y credenciales', () => {
    expect(DEMO_USERS.length).toBeGreaterThan(0);
    const usernames = DEMO_USERS.map((user) => user.username);
    expect(new Set(usernames).size).toBe(usernames.length);
    for (const user of DEMO_USERS) {
      expect(user.username).toBeTruthy();
      expect(user.password).toBeTruthy();
      expect(user.name).toBeTruthy();
      expect(Object.keys(ROLE_LEVEL)).toContain(user.role);
    }
  });

  it('incluye un usuario demo para cada nivel de rol', () => {
    const roles = new Set(DEMO_USERS.map((user) => user.role));
    expect(roles).toEqual(new Set(Object.keys(ROLE_LEVEL)));
  });
});