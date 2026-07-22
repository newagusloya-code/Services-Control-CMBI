import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  configureBackups,
  createBackupPackage,
  loadState,
  resetDatabase,
  restoreBackupPackage,
  saveState,
} from './db';

async function readRawRecord(key) {
  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('CheckSportDB', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('app', 'readonly');
    const request = transaction.objectStore('app').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

describe.sequential('persistencia local cifrada', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('guarda el estado como un sobre AES-GCM sin PII legible', async () => {
    const state = await loadState();
    const next = {
      ...state,
      members: [{
        id: 'CMBI-9001',
        name: 'Persona Confidencial',
        phone: '664 000 0000',
        age: 40,
        plan: 'Activo',
        services: ['gimnasio'],
        expiry: '2099-12-31',
        notes: '',
      }],
    };
    await saveState(next);

    const raw = await readRawRecord('state-encrypted-v2');
    expect(raw).toMatchObject({ version: 1 });
    expect(raw.iv).toBeTypeOf('string');
    expect(raw.ciphertext).toBeTypeOf('string');
    expect(JSON.stringify(raw)).not.toContain('Persona Confidencial');
    expect(JSON.stringify(raw)).not.toContain('664 000 0000');
  });

  it('restaura en otro estado el contenido de un respaldo protegido por contraseña', async () => {
    const state = await loadState();
    const protectedState = {
      ...state,
      members: [{ ...state.members[0], name: 'Miembro Respaldado' }],
    };
    await configureBackups('clave-respaldo-2026');
    const backup = await createBackupPackage(protectedState);

    await saveState({ ...state, members: [{ ...state.members[0], name: 'Cambio Posterior' }] });
    const restored = await restoreBackupPackage(backup, 'clave-respaldo-2026');

    expect(restored.members[0].name).toBe('Miembro Respaldado');
    expect(JSON.stringify(backup)).not.toContain('Miembro Respaldado');
  });
});
