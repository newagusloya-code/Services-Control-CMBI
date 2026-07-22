import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { DEMO_USERS } from '../config';
import { BrandMark } from './BrandMark';

export function Login({ onLogin }) {
  const [username, setUsername] = useState('supervisor');
  const [password, setPassword] = useState('super123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    const user = DEMO_USERS.find((item) => item.username === username.trim() && item.password === password);
    if (!user) {
      setError('Usuario o contraseña incorrectos.');
      return;
    }
    setError('');
    onLogin(user);
  };

  return (
    <div className="login-screen">
      <section className="login-intro">
        <div className="login-brand"><BrandMark /><span>CheckSport</span></div>
        <div>
          <h1>El acceso correcto, en el momento correcto.</h1>
          <p>Control local para alberca, gimnasio y sauna.</p>
        </div>
        <span className="local-note"><LockKeyhole size={17} /> La información permanece en este dispositivo</span>
      </section>
      <section className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <div>
            <h2>Iniciar sesión</h2>
            <p>Usa un perfil de demostración para entrar.</p>
          </div>
          <label>
            Usuario
            <span className="input-with-icon"><UserRound size={18} /><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" /></span>
          </label>
          <label>
            Contraseña
            <span className="input-with-icon"><LockKeyhole size={18} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" /><button type="button" className="icon-button" onClick={() => setShowPassword((value) => !value)} aria-label="Mostrar u ocultar contraseña" title="Mostrar u ocultar contraseña">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" type="submit">Entrar <ArrowRight size={18} /></button>
          <div className="demo-users">
            {DEMO_USERS.map((user) => (
              <button type="button" key={user.username} onClick={() => { setUsername(user.username); setPassword(user.password); }}>
                <strong>{user.role}</strong><span>{user.username}</span>
              </button>
            ))}
          </div>
        </form>
      </section>
    </div>
  );
}
