import { APP_NAME, SERVICES } from '../config';

export function MembershipCard({ member }) {
  return (
    <article className="membership-card" aria-label={`Credencial digital de ${member.name}`}>
      <header>
        <img src="/cmbi-logo.jpg" alt="" />
        <div><strong>{APP_NAME}</strong><span>Credencial digital</span></div>
      </header>
      <div className="membership-card-person">
        <span className="membership-card-avatar">{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
        <div><h3>{member.name}</h3><p>{member.id}</p></div>
      </div>
      <dl>
        <div><dt>Plan</dt><dd>{member.plan}</dd></div>
        <div><dt>Edad</dt><dd>{member.age} años</dd></div>
        <div><dt>WhatsApp</dt><dd>{member.phone}</dd></div>
        <div><dt>Vigencia</dt><dd>{new Date(`${member.expiry}T12:00:00`).toLocaleDateString('es-MX')}</dd></div>
      </dl>
      <p className="membership-card-services">{member.services.map((service) => SERVICES[service]?.label).filter(Boolean).join(' · ')}</p>
    </article>
  );
}
