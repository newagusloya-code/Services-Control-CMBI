export const SERVICES = {
  alberca: { label: 'Alberca', capacity: 20, minutes: 45, lockerPrefix: 'A' },
  gimnasio: { label: 'Gimnasio', capacity: 50, minutes: 90, lockerPrefix: 'G' },
  sauna: { label: 'Sauna', capacity: 8, minutes: 30, lockerPrefix: 'S' },
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
];

export const PLAN_SERVICES = {
  Esencial: ['gimnasio'],
  Activo: ['gimnasio', 'alberca'],
  Integral: ['gimnasio', 'alberca', 'sauna'],
};

export const DEMO_USERS = [
  { username: 'recepcion', password: 'recep123', name: 'Sofía Reyes', role: 'recepcion' },
  { username: 'supervisor', password: 'super123', name: 'Adrián Salas', role: 'supervisor' },
  { username: 'admin', password: 'admin123', name: 'Gerencia CMBI', role: 'gerencia' },
];
