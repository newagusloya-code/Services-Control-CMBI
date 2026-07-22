import { createSeedState } from '../data/seed';

const DB_NAME = 'CheckSportDB';
const DB_VERSION = 1;
const STORE_NAME = 'app';
const STATE_KEY = 'state';
const FINANCE_KEY = 'finance';

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

export async function loadState() {
  const stored = await readRecord(STATE_KEY);
  if (stored) return stored;
  const seed = createSeedState();
  await writeRecord(STATE_KEY, seed);
  return seed;
}

export const saveState = (state) => writeRecord(STATE_KEY, state);
export const loadFinanceCipher = () => readRecord(FINANCE_KEY);
export const saveFinanceCipher = (payload) => writeRecord(FINANCE_KEY, payload);

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
