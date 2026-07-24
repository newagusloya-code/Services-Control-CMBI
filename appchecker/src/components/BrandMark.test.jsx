// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { BrandMark } from './BrandMark';

afterEach(() => cleanup());

describe('BrandMark', () => {
  it('renderiza el logo de CMBI como una imagen decorativa', () => {
    const { container } = render(<BrandMark />);
    const img = container.querySelector('img.brand-mark');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('/cmbi-logo.jpg');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
  });
});