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

export function validateTherapyDetails(service, therapyType) {
  if (service === 'therapy' && !therapyType?.trim()) {
    return 'Escribe la terapia que se realizará.';
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

export function allocateSessionResource({ lockers, sessions, service, memberId }) {
  if (service === 'therapy') {
    const occupiedRooms = new Set(activeSessions(sessions)
      .filter((session) => session.service === 'therapy')
      .map((session) => session.room));
    const room = SERVICES.therapy.rooms.find((item) => !occupiedRooms.has(item)) ?? null;
    return { lockers, resourceId: room, room };
  }

  const allocation = allocateLocker(lockers, service, memberId);
  return { lockers: allocation.lockers, resourceId: allocation.lockerId, locker: allocation.lockerId };
}

export function releaseLocker(lockers, lockerId) {
  if (!lockerId) return lockers;
  return lockers.map((item) => item.id === lockerId ? { ...item, status: 'free', memberId: null } : item);
}

export function getSessionAssignment(session) {
  return session.room ?? session.locker ?? '—';
}

export function normalizeTherapyType(value) {
  return value.trim().toLocaleLowerCase('es');
}

export function therapyPriceFor(prices, therapyType) {
  if (!therapyType) return 0;
  return Number(prices?.[normalizeTherapyType(therapyType)]?.price ?? 0);
}

export function sessionPrice(session, settings) {
  if (session.service !== 'therapy') return Number(session.amount ?? 0);
  return therapyPriceFor(settings?.therapyPrices, session.therapyType);
}

export function daysRemaining(expiry, now = new Date()) {
  if (!expiry) return 0;
  const end = new Date(`${expiry}T23:59:59`);
  return Math.max(0, Math.ceil((end - now) / 86_400_000));
}

export function generateMemberId(members, now = Date.now()) {
  const used = new Set(members.map((member) => member.id));
  const seed = Number(String(now).slice(-4));
  for (let offset = 0; offset < 10_000; offset += 1) {
    const id = `CMBI-${String((seed + offset) % 10_000).padStart(4, '0')}`;
    if (!used.has(id)) return id;
  }
  return `CMBI-${now}`;
}

export function csvEscape(value, delimiter = ',') {
  const text = String(value ?? '');
  return text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
