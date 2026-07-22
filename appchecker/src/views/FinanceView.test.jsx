// @vitest-environment jsdom

import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resetDatabase } from '../lib/db';
import { FinanceView } from './FinanceView';

afterEach(() => cleanup());

describe('Ingresos', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it('refleja el precio vigente de Therapy al desbloquear la sección', async () => {
    const user = userEvent.setup();
    const sessions = [{
      id: 'therapy-income-1',
      memberId: 'CMBI-4001',
      memberName: 'Nora Gil',
      service: 'therapy',
      therapyType: 'Masaje relajante',
      checkIn: new Date().toISOString(),
      checkOut: null,
      room: 'Ruby',
    }];
    const settings = {
      therapyPrices: {
        'masaje relajante': { label: 'Masaje relajante', price: 650 },
      },
    };

    render(<FinanceView currentUser={{ username: 'admin' }} sessions={sessions} settings={settings} onToast={vi.fn()} />);
    await user.type(screen.getByLabelText('Clave privada'), 'clave-local-2026');
    await user.click(screen.getByRole('button', { name: 'Desbloquear ingresos' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ingresos' })).toBeTruthy());
    expect(screen.getByText('Masaje relajante')).toBeTruthy();
    expect(screen.getAllByText('$650.00').length).toBeGreaterThanOrEqual(2);
  });
});
