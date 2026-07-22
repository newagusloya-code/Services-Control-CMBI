// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrandMark } from './BrandMark';

afterEach(() => cleanup());

describe('BrandMark', () => {
  it('renderiza el logo de CMBI como decorativo, oculto para lectores de pantalla', () => {
    render(<BrandMark />);
    const logo = screen.getByRole('img', { hidden: true });
    expect(logo.getAttribute('src')).toBe('/cmbi-logo.jpg');
    expect(logo.getAttribute('alt')).toBe('');
    expect(logo.getAttribute('aria-hidden')).toBe('true');
    expect(logo.className).toBe('brand-mark');
  });
});