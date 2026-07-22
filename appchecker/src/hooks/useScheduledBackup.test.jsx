// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { configureBackups, loadState, resetDatabase, saveState } from '../lib/db';

const downloadJson = vi.hoisted(() => vi.fn());
vi.mock('../lib/download', () => ({ downloadJson }));

import { useAppState } from './useAppState';

describe('respaldo programado', () => {
  beforeEach(async () => {
    downloadJson.mockClear();
    await resetDatabase();
  });

  it('genera y descarga un respaldo cifrado vencido al iniciar', async () => {
    const state = await loadState();
    await configureBackups('clave-programada-2026');
    await saveState({
      ...state,
      settings: { ...state.settings, backupSchedule: 'daily', lastBackupAt: null },
    });

    const { result } = renderHook(() => useAppState({ username: 'admin' }));
    await waitFor(() => expect(result.current.state?.settings.lastBackupAt).toBeTruthy());

    expect(downloadJson).toHaveBeenCalledTimes(1);
    expect(downloadJson.mock.calls[0][0]).toMatchObject({ app: 'Service Control CMBI', version: 1 });
    expect(downloadJson.mock.calls[0][1]).toMatch(/^service-control-cmbi-respaldo-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
