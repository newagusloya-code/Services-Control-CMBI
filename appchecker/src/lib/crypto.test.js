import { describe, expect, it } from 'vitest';
import {
  createWrappedBackupKey,
  decryptJsonWithKey,
  encryptJsonWithKey,
  unwrapBackupKey,
} from './crypto';

describe('cifrado local y respaldos', () => {
  it('cifra y descifra un respaldo con una clave envuelta por contraseña', async () => {
    const password = 'respaldo-seguro-2026';
    const { key, wrappedKey } = await createWrappedBackupKey(password);
    const payload = await encryptJsonWithKey({ members: [{ id: 'CMBI-1001' }] }, key);
    const restoredKey = await unwrapBackupKey(wrappedKey, password);
    await expect(decryptJsonWithKey(payload, restoredKey)).resolves.toEqual({ members: [{ id: 'CMBI-1001' }] });
  });

  it('rechaza una contraseña de respaldo incorrecta', async () => {
    const { wrappedKey } = await createWrappedBackupKey('clave-correcta-2026');
    await expect(unwrapBackupKey(wrappedKey, 'clave-incorrecta')).rejects.toThrow();
  });
});
