// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from './Toast';

afterEach(() => cleanup());

describe('Toast', () => {
  it('no renderiza nada cuando no hay un toast activo', () => {
    const { container } = render(<Toast toast={null} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('muestra el mensaje y el tono de éxito', () => {
    render(<Toast toast={{ message: 'Entrada registrada', tone: 'success' }} onClose={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('Entrada registrada');
    expect(status.className).toContain('toast-success');
  });

  it('muestra el mensaje y el tono de error', () => {
    render(<Toast toast={{ message: 'La membresía está vencida.', tone: 'error' }} onClose={vi.fn()} />);
    const status = screen.getByRole('status');
    expect(status.textContent).toContain('La membresía está vencida.');
    expect(status.className).toContain('toast-error');
  });

  it('invoca onClose al hacer clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<Toast toast={{ message: 'Aviso', tone: 'success' }} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});