import { ROLE_LEVEL, SERVICES } from '../config';

export function canAccess(role, minimumRole) {
  return ROLE_LEVEL[role] >= ROLE_LEVEL[minimumRole];
}

export function isMemberActive(member, now = new Date()) {
  const expiry = new Date(`${member.expiry}T23:59:59`);
  return expiry >= now;
}

export function activeSessions(sessions) {
  return sessions.filter((session) => !session.checkOut);
}

export function occupancyFor(sessions, service) {
  return activeSessions(sessions).filter((session) => session.service === service).length;
}

export function validateCheckIn({ member, service, sessions }) {
  if (!member) return 'Selecciona un miembro válido.';
  if (!service || !SERVICES[service]) return 'Selecciona un servicio.';
  if (!isMemberActive(member)) return 'La membresía está vencida.';
  if (!member.services.includes(service)) return `El plan ${member.plan} no incluye ${SERVICES[service].label}.`;
  if (sessions.some((session) => session.memberId === member.id && !session.checkOut)) {
    return 'El miembro ya tiene una sesión activa.';
  }
  if (occupancyFor(sessions, service) >= SERVICES[service].capacity) {
    return `${SERVICES[service].label} llegó a su capacidad máxima.`;
  }
  return null;
}

export function getSessionStatus(session, now = Date.now()) {
  const elapsed = Math.max(0, Math.floor((now - new Date(session.checkIn).getTime()) / 60_000));
  const limit = SERVICES[session.service]?.minutes ?? 0;
  const remaining = limit - elapsed;
  if (remaining < 0) return { tone: 'danger', label: 'Tiempo excedido', elapsed, remaining };
  if (remaining <= 15) return { tone: 'warning', label: `${remaining} min restantes`, elapsed, remaining };
  return { tone: 'success', label: 'En tiempo', elapsed, remaining };
}

export function allocateLocker(lockers, service, memberId) {
  const prefix = SERVICES[service].lockerPrefix;
  const locker = lockers.find((item) => item.id.startsWith(`${prefix}-`) && item.status === 'free');
  if (!locker) return { lockers, lockerId: null };
  return {
    lockerId: locker.id,
    lockers: lockers.map((item) => item.id === locker.id ? { ...item, status: 'occupied', memberId } : item),
  };
}

export function releaseLocker(lockers, lockerId) {
  return lockers.map((item) => item.id === lockerId ? { ...item, status: 'free', memberId: null } : item);
}

export function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
