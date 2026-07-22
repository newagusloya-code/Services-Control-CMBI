import { SERVICES } from '../config';

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60_000).toISOString();
const daysAgo = (days, hour) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 15, 0, 0);
  return date.toISOString();
};

const futureDate = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
};

export function createSeedState() {
  const members = [
    { id: 'CMBI-1042', name: 'Mariana López', phone: '664 555 1042', age: 34, plan: 'Integral', services: ['alberca', 'gimnasio', 'sauna', 'therapy'], expiry: futureDate(2), notes: '' },
    { id: 'CMGR-0891', name: 'Roberto Díaz', phone: '664 555 0891', age: 42, plan: 'Activo', services: ['gimnasio', 'alberca'], expiry: futureDate(4), notes: '' },
    { id: 'CMIN-0765', name: 'Laura Méndez', phone: '664 555 0765', age: 29, plan: 'Integral', services: ['gimnasio', 'alberca', 'sauna', 'therapy'], expiry: futureDate(1), notes: '' },
    { id: 'CMGR-0632', name: 'Diego Ruiz', phone: '664 555 0632', age: 38, plan: 'Esencial', services: ['gimnasio'], expiry: futureDate(3), notes: '' },
    { id: 'CMBI-1120', name: 'Carlos Herrera', phone: '664 555 1120', age: 46, plan: 'Activo', services: ['gimnasio', 'alberca'], expiry: futureDate(5), notes: '' },
    { id: 'CMBI-1198', name: 'Elena Torres', phone: '664 555 1198', age: 51, plan: 'Integral', services: ['gimnasio', 'alberca', 'sauna', 'therapy'], expiry: futureDate(-1), notes: 'Membresía vencida' },
  ];

  const sessions = [
    { id: crypto.randomUUID(), memberId: 'CMBI-1042', memberName: 'Mariana López', service: 'alberca', checkIn: minutesAgo(28), checkOut: null, locker: 'A-12' },
    { id: crypto.randomUUID(), memberId: 'CMGR-0891', memberName: 'Roberto Díaz', service: 'gimnasio', checkIn: minutesAgo(78), checkOut: null, locker: 'G-07' },
    { id: crypto.randomUUID(), memberId: 'CMIN-0765', memberName: 'Laura Méndez', service: 'sauna', checkIn: minutesAgo(18), checkOut: null, locker: 'S-01' },
    { id: crypto.randomUUID(), memberId: 'CMGR-0632', memberName: 'Diego Ruiz', service: 'gimnasio', checkIn: minutesAgo(145), checkOut: null, locker: 'G-15' },
    { id: crypto.randomUUID(), memberId: 'CMBI-1120', memberName: 'Carlos Herrera', service: 'gimnasio', checkIn: minutesAgo(190), checkOut: minutesAgo(105), locker: 'G-11' },
  ];

  for (let day = 1; day <= 14; day += 1) {
    const member = members[day % 5];
    const service = Object.keys(SERVICES)[day % 3];
    const checkIn = daysAgo(day, 8 + (day % 8));
    const duration = 35 + ((day * 11) % 64);
    sessions.push({
      id: crypto.randomUUID(),
      memberId: member.id,
      memberName: member.name,
      service,
      checkIn,
      checkOut: new Date(new Date(checkIn).getTime() + duration * 60_000).toISOString(),
      duration,
      locker: `${SERVICES[service].lockerPrefix}-${String((day % 24) + 1).padStart(2, '0')}`,
    });
  }

  const lockers = Object.values(SERVICES).filter((service) => service.lockerPrefix).flatMap((service) =>
    Array.from({ length: service.lockerCount }, (_, index) => ({
      id: `${service.lockerPrefix}-${String(index + 1).padStart(2, '0')}`,
      status: 'free',
      memberId: null,
    })),
  );

  sessions.filter((session) => !session.checkOut).forEach((session) => {
    const locker = lockers.find((item) => item.id === session.locker);
    if (locker) {
      locker.status = 'occupied';
      locker.memberId = session.memberId;
    }
  });

  return {
    version: 2,
    members,
    sessions,
    lockers,
    audit: [],
    settings: {
      sickarEndpoint: '',
      printerMode: 'browser',
      therapyPrices: {},
      backupSchedule: 'manual',
      lastBackupAt: null,
    },
  };
}
