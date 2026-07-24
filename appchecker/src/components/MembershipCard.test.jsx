// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MembershipCard } from './MembershipCard';

afterEach(() => cleanup());

const member = {
  id: 'CMBI-1042',
  name: 'Mariana López',
  phone: '664 555 1042',
  age: 34,
  plan: 'Integral',
  services: ['alberca', 'gimnasio', 'sauna', 'therapy'],
  expiry: '2030-05-15',
  notes: '',
};

describe('MembershipCard', () => {
  it('muestra los datos principales del miembro', () => {
    render(<MembershipCard member={member} />);

    expect(screen.getByRole('heading', { name: 'Mariana López' })).toBeTruthy();
    expect(screen.getByText('CMBI-1042')).toBeTruthy();
    expect(screen.getByText('Integral')).toBeTruthy();
    expect(screen.getByText('34 años')).toBeTruthy();
    expect(screen.getByText('664 555 1042')).toBeTruthy();
  });

  it('junta las etiquetas de los servicios incluidos separadas por " · "', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByText('Alberca · Gimnasio · Sauna · Therapy')).toBeTruthy();
  });

  it('ignora servicios desconocidos sin generar etiquetas vacías', () => {
    const memberWithUnknownService = { ...member, services: ['alberca', 'servicio-inexistente'] };
    render(<MembershipCard member={memberWithUnknownService} />);
    expect(screen.getByText('Alberca')).toBeTruthy();
  });

  it('expone una etiqueta accesible con el nombre del miembro', () => {
    render(<MembershipCard member={member} />);
    expect(screen.getByLabelText('Credencial digital de Mariana López')).toBeTruthy();
  });

  it('genera las iniciales del avatar a partir del nombre', () => {
    const { container } = render(<MembershipCard member={member} />);
    expect(container.querySelector('.membership-card-avatar').textContent).toBe('ML');
  });
});