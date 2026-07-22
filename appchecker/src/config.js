export const APP_NAME = 'Service Control CMBI';

export const THERAPY_ROOMS = ['Ruby', 'Topacio', 'Onyx'];

export const SERVICES = {
  alberca: { label: 'Alberca', capacity: 20, minutes: 45, lockerPrefix: 'A', lockerCount: 20, assignmentLabel: 'Locker' },
  gimnasio: { label: 'Gimnasio', capacity: 50, minutes: 90, lockerPrefix: 'G', lockerCount: 20, assignmentLabel: 'Locker' },
  sauna: { label: 'Sauna', capacity: 2, minutes: 30, lockerPrefix: 'S', lockerCount: 2, assignmentLabel: 'Locker' },
  therapy: { label: 'Therapy', capacity: 3, minutes: 60, rooms: THERAPY_ROOMS, assignmentLabel: 'Consultorio' },
};

export const ROLE_LEVEL = {
  recepcion: 1,
  supervisor: 2,
  gerencia: 3,
};

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Resumen', minimumRole: 'recepcion' },
  { id: 'checkin', label: 'Entradas', minimumRole: 'recepcion' },
  { id: 'members', label: 'Miembros', minimumRole: 'recepcion' },
  { id: 'lockers', label: 'Lockers', minimumRole: 'supervisor' },
  { id: 'reports', label: 'Reportes', minimumRole: 'supervisor' },
  { id: 'finance', label: 'Ingresos', minimumRole: 'gerencia' },
  { id: 'settings', label: 'Configuración', minimumRole: 'gerencia' },
];

export const PLAN_SERVICES = {
  Esencial: ['gimnasio'],
  Activo: ['gimnasio', 'alberca'],
  Integral: ['gimnasio', 'alberca', 'sauna', 'therapy'],
};

export const DEMO_USERS = [
  { username: 'recepcion', password: 'recep123', name: 'Sofía Reyes', role: 'recepcion' },
  { username: 'supervisor', password: 'super123', name: 'Adrián Salas', role: 'supervisor' },
  { username: 'admin', password: 'admin123', name: 'Gerencia CMBI', role: 'gerencia' },
];
