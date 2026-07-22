// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetDatabase } from '../lib/db';
import { useAppState } from './useAppState';

describe('estado completo de sesiones', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('persiste entrada, consultorio, salida y duración de Therapy', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    const member = {
      id: 'CMBI-9100',
      name: 'Teresa Luna',
      phone: '664 555 9100',
      age: 45,
      plan: 'Integral',
      services: ['therapy'],
      expiry: '2099-12-31',
      notes: '',
    };
    await act(async () => result.current.saveMember(member));

    let checkIn;
    await act(async () => {
      checkIn = await result.current.checkIn(member, 'therapy', { therapyType: 'Masaje terapéutico' });
    });
    expect(checkIn).toMatchObject({ ok: true, session: { service: 'therapy', room: 'Ruby', therapyType: 'Masaje terapéutico', checkOut: null } });
    expect(result.current.state.sessions.find((session) => session.id === checkIn.session.id)).toMatchObject({ room: 'Ruby', checkOut: null });

    let checkOut;
    await act(async () => {
      checkOut = await result.current.checkOut(checkIn.session.id);
    });
    expect(checkOut.ok).toBe(true);
    expect(checkOut.duration).toBeGreaterThanOrEqual(1);
    expect(result.current.state.sessions.find((session) => session.id === checkIn.session.id)).toMatchObject({ room: 'Ruby', duration: checkOut.duration });
  });
});
