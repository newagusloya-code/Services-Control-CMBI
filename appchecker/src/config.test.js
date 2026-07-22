import { describe, expect, it } from 'vitest';
import {
  APP_NAME,
  DEMO_USERS,
  NAV_ITEMS,
  PLAN_SERVICES,
  ROLE_LEVEL,
  SERVICES,
  THERAPY_ROOMS,
} from './config';

describe('configuración de la aplicación', () => {
  it('define el nombre de la aplicación', () => {
    expect(APP_NAME).toBe('Service Control CMBI');
  });

  it('define tres consultorios de Therapy únicos', () => {
    expect(THERAPY_ROOMS).toEqual(['Ruby', 'Topacio', 'Onyx']);
    expect(new Set(THERAPY_ROOMS).size).toBe(THERAPY_ROOMS.length);
  });

  it('define los cuatro servicios con capacidad, minutos y etiqueta de asignación', () => {
    expect(Object.keys(SERVICES)).toEqual(['alberca', 'gimnasio', 'sauna', 'therapy']);
    Object.values(SERVICES).forEach((service) => {
      expect(service.label).toBeTruthy();
      expect(service.capacity).toBeGreaterThan(0);
      expect(service.minutes).toBeGreaterThan(0);
      expect(['Locker', 'Consultorio']).toContain(service.assignmentLabel);
    });
  });

  it('limita Sauna a capacidad 2 y a dos lockers', () => {
    expect(SERVICES.sauna.capacity).toBe(2);
    expect(SERVICES.sauna.lockerCount).toBe(2);
  });

  it('asigna a Therapy los tres consultorios en lugar de lockers', () => {
    expect(SERVICES.therapy.rooms).toBe(THERAPY_ROOMS);
    expect(SERVICES.therapy.lockerPrefix).toBeUndefined();
  });

  it('ordena los niveles de rol de menor a mayor privilegio', () => {
    expect(ROLE_LEVEL.recepcion).toBeLessThan(ROLE_LEVEL.supervisor);
    expect(ROLE_LEVEL.supervisor).toBeLessThan(ROLE_LEVEL.gerencia);
  });

  it('cada elemento de navegación referencia un rol mínimo válido', () => {
    NAV_ITEMS.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.label).toBeTruthy();
      expect(ROLE_LEVEL).toHaveProperty(item.minimumRole);
    });
  });

  it('restringe Ingresos y Configuración a gerencia', () => {
    const restricted = NAV_ITEMS.filter((item) => item.id === 'finance' || item.id === 'settings');
    expect(restricted).toHaveLength(2);
    restricted.forEach((item) => expect(item.minimumRole).toBe('gerencia'));
  });

  it('asocia cada plan únicamente con servicios existentes', () => {
    Object.values(PLAN_SERVICES).forEach((services) => {
      services.forEach((serviceId) => expect(SERVICES).toHaveProperty(serviceId));
    });
  });

  it('el plan Integral incluye los cuatro servicios', () => {
    expect(PLAN_SERVICES.Integral).toEqual(['gimnasio', 'alberca', 'sauna', 'therapy']);
  });

  it('define un usuario de demostración por cada rol', () => {
    const roles = DEMO_USERS.map((user) => user.role);
    expect(roles.sort()).toEqual(['gerencia', 'recepcion', 'supervisor']);
    DEMO_USERS.forEach((user) => {
      expect(user.username).toBeTruthy();
      expect(user.password).toBeTruthy();
      expect(user.name).toBeTruthy();
    });
  });
});