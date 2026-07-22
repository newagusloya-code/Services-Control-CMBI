import { createSeedState } from '../data/seed';
import { SERVICES } from '../config';
import {
  createWrappedBackupKey,
  decryptJsonWithKey,
  encryptJsonWithKey,
  unwrapBackupKey,
} from './crypto';

const DB_NAME = 'CheckSportDB';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const LEGACY_STATE_KEY = 'state';
const STATE_KEY = 'state-encrypted-v2';
const DEVICE_KEY = 'state-device-key';
const FINANCE_KEY = 'finance';
const BACKUP_KEY = 'backup-key';
const BACKUP_META_KEY = 'backup-meta';
const LATEST_BACKUP_KEY = 'latest-backup';

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readRecord(key) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function writeRecord(key, value) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => {
      database.close();
      resolve(value);
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteRecord(key) {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getDeviceKey() {
  const stored = await readRecord(DEVICE_KEY);
  if (stored) return stored;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await writeRecord(DEVICE_KEY, key);
  return key;
}

export function migrateState(input) {
  const seed = createSeedState();
  const source = input && typeof input === 'object' ? input : seed;
  const validLockerIds = new Set(seed.lockers.map((locker) => locker.id));
  const lockersById = new Map((source.lockers ?? [])
    .filter((locker) => validLockerIds.has(locker.id))
    .map((locker) => [locker.id, { ...locker }]));
  seed.lockers.forEach((locker) => {
    if (!lockersById.has(locker.id)) lockersById.set(locker.id, locker);
  });

  const lockers = [...lockersById.values()].map((locker) => ({ ...locker, status: locker.status === 'maintenance' ? 'maintenance' : 'free', memberId: null }));
  const sessions = (source.sessions ?? seed.sessions).map((session) => ({ ...session }));
  const occupied = new Set();
  sessions.filter((session) => !session.checkOut && session.service !== 'therapy').forEach((session) => {
    let lockerId = session.locker;
    if (!validLockerIds.has(lockerId) || occupied.has(lockerId)) {
      const prefix = SERVICES[session.service]?.lockerPrefix;
      lockerId = lockers.find((locker) => locker.id.startsWith(`${prefix}-`) && locker.status === 'free' && !occupied.has(locker.id))?.id ?? null;
      session.locker = lockerId;
    }
    const locker = lockers.find((item) => item.id === lockerId);
    if (locker) {
      locker.status = 'occupied';
      locker.memberId = session.memberId;
      occupied.add(locker.id);
    }
  });

  return {
    ...source,
    version: 3,
    members: (source.members ?? seed.members).map((member) => {
      const { email: _email, ...safeMember } = member;
      const services = safeMember.plan === 'Integral'
        ? [...new Set([...(safeMember.services ?? []), 'therapy'])]
        : safeMember.services ?? [];
      return { ...safeMember, age: Number(safeMember.age) || '', services };
    }),
    sessions,
    lockers,
    audit: source.audit ?? [],
    settings: {
      ...seed.settings,
      ...(source.settings ?? {}),
      therapyPrices: source.settings?.therapyPrices ?? {},
    },
  };
}

export async function loadState() {
  const deviceKey = await getDeviceKey();
  const encrypted = await readRecord(STATE_KEY);
  const legacy = encrypted ? null : await readRecord(LEGACY_STATE_KEY);
  const current = encrypted ? await decryptJsonWithKey(encrypted, deviceKey) : legacy ?? createSeedState();
  const migrated = migrateState(current);
  await writeRecord(STATE_KEY, await encryptJsonWithKey(migrated, deviceKey));
  if (legacy) await deleteRecord(LEGACY_STATE_KEY);
  return migrated;
}

export async function saveState(state) {
  const deviceKey = await getDeviceKey();
  const migrated = migrateState(state);
  await writeRecord(STATE_KEY, await encryptJsonWithKey(migrated, deviceKey));
  return migrated;
}
export const loadFinanceCipher = () => readRecord(FINANCE_KEY);
export const saveFinanceCipher = (payload) => writeRecord(FINANCE_KEY, payload);

export async function configureBackups(password) {
  const { key, wrappedKey } = await createWrappedBackupKey(password);
  await Promise.all([
    writeRecord(BACKUP_KEY, key),
    writeRecord(BACKUP_META_KEY, { wrappedKey, configuredAt: new Date().toISOString() }),
  ]);
}

export async function createBackupPackage(state) {
  const [key, meta] = await Promise.all([readRecord(BACKUP_KEY), readRecord(BACKUP_META_KEY)]);
  if (!key || !meta?.wrappedKey) throw new Error('BACKUP_NOT_CONFIGURED');
  const backup = {
    app: 'Service Control CMBI',
    version: 1,
    createdAt: new Date().toISOString(),
    wrappedKey: meta.wrappedKey,
    payload: await encryptJsonWithKey(migrateState(state), key),
  };
  await writeRecord(LATEST_BACKUP_KEY, backup);
  return backup;
}

export async function restoreBackupPackage(backup, password) {
  if (backup?.app !== 'Service Control CMBI' || !backup?.wrappedKey || !backup?.payload) {
    throw new Error('INVALID_BACKUP');
  }
  const key = await unwrapBackupKey(backup.wrappedKey, password);
  const restored = migrateState(await decryptJsonWithKey(backup.payload, key));
  await Promise.all([
    writeRecord(BACKUP_KEY, key),
    writeRecord(BACKUP_META_KEY, { wrappedKey: backup.wrappedKey, configuredAt: new Date().toISOString() }),
    writeRecord(LATEST_BACKUP_KEY, backup),
    saveState(restored),
  ]);
  return restored;
}

export async function getBackupStatus() {
  const [key, latest] = await Promise.all([readRecord(BACKUP_KEY), readRecord(LATEST_BACKUP_KEY)]);
  return { configured: Boolean(key), latestAt: latest?.createdAt ?? null };
}

export function backupIsDue(settings, now = Date.now()) {
  if (!settings || settings.backupSchedule === 'manual') return false;
  const interval = settings.backupSchedule === 'daily' ? 86_400_000 : 604_800_000;
  return !settings.lastBackupAt || now - new Date(settings.lastBackupAt).getTime() >= interval;
}

export async function resetDatabase() {
  const database = await openDatabase();
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return loadState();
}
