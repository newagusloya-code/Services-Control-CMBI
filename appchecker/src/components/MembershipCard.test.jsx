// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MembershipCard } from './MembershipCard';

afterEach(() => cleanup());

const member = {
  id: 'CMBI-2001',
  name: 'Ana López García',
  phone: '664 555 2001',
  age: 36,
  plan: 'Integral',
  services: ['alberca', 'gimnasio', 'sauna', 'therapy'],
  expiry: '2099-12-31',
};

describe('MembershipCard', () => {
  it('muestra los datos principales del miembro', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByRole('heading', { name: 'Ana López García' })).toBeTruthy();
    expect(screen.getByText('CMBI-2001')).toBeTruthy();
    expect(screen.getByText('Integral')).toBeTruthy();
    expect(screen.getByText('36 años')).toBeTruthy();
    expect(screen.getByText('664 555 2001')).toBeTruthy();
  });

  it('formatea la vigencia con el formato local es-MX', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByText(new Date('2099-12-31T12:00:00').toLocaleDateString('es-MX'))).toBeTruthy();
  });

  it('lista las etiquetas de los servicios incluidos separadas por punto medio', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByText('Alberca · Gimnasio · Sauna · Therapy')).toBeTruthy();
  });

  it('ignora identificadores de servicio desconocidos sin romper el render', () => {
    const memberWithUnknownService = { ...member, services: ['alberca', 'yoga'] };
    render(<MembershipCard member={memberWithUnknownService} />);
    expect(screen.getByText('Alberca')).toBeTruthy();
  });

  it('genera un rótulo accesible con el nombre del miembro', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByLabelText('Credencial digital de Ana López García')).toBeTruthy();
  });

  it('usa las iniciales de las primeras dos palabras del nombre para el avatar', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByText('AL')).toBeTruthy();
  });
});