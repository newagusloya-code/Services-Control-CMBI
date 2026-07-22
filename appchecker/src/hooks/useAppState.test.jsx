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

describe('validaciones y operaciones adicionales del estado', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('impide el check-in cuando el plan del miembro no incluye el servicio solicitado', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // Diego Ruiz (CMGR-0632) tiene plan Esencial, que sólo incluye gimnasio.
    const member = result.current.state.members.find((item) => item.id === 'CMGR-0632');

    let checkIn;
    await act(async () => {
      checkIn = await result.current.checkIn(member, 'alberca');
    });

    expect(checkIn).toEqual({ ok: false, message: 'El plan Esencial no incluye Alberca.' });
  });

  it('impide el check-in cuando la membresía del miembro está vencida', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // Elena Torres (CMBI-1198) tiene una fecha de vigencia en el pasado.
    const member = result.current.state.members.find((item) => item.id === 'CMBI-1198');

    let checkIn;
    await act(async () => {
      checkIn = await result.current.checkIn(member, 'gimnasio');
    });

    expect(checkIn).toEqual({ ok: false, message: 'La membresía está vencida.' });
  });

  it('impide el check-in cuando el miembro ya tiene una sesión activa en otro servicio', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // Mariana López (CMBI-1042) ya tiene una sesión activa de alberca en el estado semilla.
    const member = result.current.state.members.find((item) => item.id === 'CMBI-1042');

    let checkIn;
    await act(async () => {
      checkIn = await result.current.checkIn(member, 'gimnasio');
    });

    expect(checkIn).toEqual({ ok: false, message: 'El miembro ya tiene una sesión activa.' });
  });

  it('impide el check-in cuando el servicio alcanzó su capacidad máxima', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // Sauna tiene capacidad 2 y el estado semilla ya tiene una sesión activa (Laura Méndez).
    const memberX = { id: 'CMBI-9200', name: 'Nadia Solís', phone: '664 555 9200', age: 30, plan: 'Integral', services: ['sauna'], expiry: '2099-12-31', notes: '' };
    const memberY = { id: 'CMBI-9201', name: 'Oscar Vega', phone: '664 555 9201', age: 33, plan: 'Integral', services: ['sauna'], expiry: '2099-12-31', notes: '' };
    await act(async () => {
      await result.current.saveMember(memberX);
      await result.current.saveMember(memberY);
    });

    let firstCheckIn;
    await act(async () => {
      firstCheckIn = await result.current.checkIn(memberX, 'sauna');
    });
    expect(firstCheckIn.ok).toBe(true);

    let secondCheckIn;
    await act(async () => {
      secondCheckIn = await result.current.checkIn(memberY, 'sauna');
    });
    expect(secondCheckIn).toEqual({ ok: false, message: 'Sauna llegó a su capacidad máxima.' });
  });

  it('bloquea eliminar un miembro con una sesión activa y lo permite después de registrar la salida', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    // Roberto Díaz (CMGR-0891) tiene una sesión activa de gimnasio en el estado semilla.
    const activeSession = result.current.state.sessions.find((session) => session.memberId === 'CMGR-0891' && !session.checkOut);

    let blocked;
    await act(async () => {
      blocked = await result.current.deleteMember('CMGR-0891');
    });
    expect(blocked).toEqual({ ok: false, message: 'Registra la salida antes de eliminar al miembro.' });
    expect(result.current.state.members.some((member) => member.id === 'CMGR-0891')).toBe(true);

    await act(async () => {
      await result.current.checkOut(activeSession.id);
    });

    let allowed;
    await act(async () => {
      allowed = await result.current.deleteMember('CMGR-0891');
    });
    expect(allowed).toEqual({ ok: true });
    expect(result.current.state.members.some((member) => member.id === 'CMGR-0891')).toBe(false);
  });

  it('alterna un locker libre a mantenimiento y de vuelta, pero no altera un locker ocupado', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    const freeLocker = result.current.state.lockers.find((locker) => locker.status === 'free');
    let toggled;
    await act(async () => {
      toggled = await result.current.toggleLocker(freeLocker.id);
    });
    expect(toggled).toBe(true);
    expect(result.current.state.lockers.find((locker) => locker.id === freeLocker.id).status).toBe('maintenance');

    await act(async () => {
      await result.current.toggleLocker(freeLocker.id);
    });
    expect(result.current.state.lockers.find((locker) => locker.id === freeLocker.id).status).toBe('free');

    // El locker G-07 está ocupado por Roberto Díaz en el estado semilla.
    let blockedToggle;
    await act(async () => {
      blockedToggle = await result.current.toggleLocker('G-07');
    });
    expect(blockedToggle).toBe(false);
    expect(result.current.state.lockers.find((locker) => locker.id === 'G-07').status).toBe('occupied');
  });

  it('combina la configuración nueva con la existente sin perder las claves previas', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.saveSettings({ printerMode: 'thermal' });
    });

    expect(result.current.state.settings).toMatchObject({
      printerMode: 'thermal',
      backupSchedule: 'manual',
      sickarEndpoint: '',
    });
  });

  it('resetDemo restaura el estado semilla original después de haber realizado cambios', async () => {
    const { result } = renderHook(() => useAppState({ username: 'recepcion' }));
    await waitFor(() => expect(result.current.state).not.toBeNull());

    await act(async () => {
      await result.current.saveMember({ id: 'CMBI-9300', name: 'Temporal', phone: '664 555 9300', age: 20, plan: 'Esencial', services: ['gimnasio'], expiry: '2099-12-31', notes: '' });
    });
    expect(result.current.state.members.some((member) => member.id === 'CMBI-9300')).toBe(true);

    await act(async () => {
      await result.current.resetDemo();
    });

    expect(result.current.state.members.some((member) => member.id === 'CMBI-9300')).toBe(false);
    expect(result.current.state.members).toHaveLength(6);
  });
});
