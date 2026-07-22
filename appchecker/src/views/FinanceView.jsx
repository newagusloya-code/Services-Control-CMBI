import { Download, KeyRound, LockKeyhole, Plus, ShieldCheck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { decryptJson, encryptJson } from '../lib/crypto';
import { loadFinanceCipher, saveFinanceCipher } from '../lib/db';

export function FinanceView({ currentUser, onToast }) {
  const [password, setPassword] = useState('');
  const [key, setKey] = useState('');
  const [payments, setPayments] = useState(null);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ member: '', concept: 'Membresía', amount: '', method: 'Tarjeta' });
  const total = useMemo(() => (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0), [payments]);

  const unlock = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      onToast('La clave debe tener al menos 8 caracteres.', 'error');
      return;
    }
    setBusy(true);
    try {
      const cipher = await loadFinanceCipher();
      const data = cipher ? await decryptJson(cipher, password) : [];
      setPayments(data);
      setKey(password);
      setPassword('');
      onToast(cipher ? 'Ingresos descifrados en este dispositivo.' : 'Caja cifrada creada.', 'success');
    } catch {
      onToast('La clave no coincide con los datos cifrados.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const savePayment = async (event) => {
    event.preventDefault();
    const amount = Number(draft.amount);
    if (!draft.member.trim() || !Number.isFinite(amount) || amount <= 0) {
      onToast('Captura un miembro y un monto válido.', 'error');
      return;
    }
    const payment = { id: crypto.randomUUID(), date: new Date().toISOString(), ...draft, amount, registeredBy: currentUser.username };
    const next = [payment, ...payments];
    const cipher = await encryptJson(next, key);
    await saveFinanceCipher(cipher);
    setPayments(next);
    setAdding(false);
    setDraft({ member: '', concept: 'Membresía', amount: '', method: 'Tarjeta' });
    onToast('Ingreso cifrado y guardado.', 'success');
  };

  const exportEncrypted = async () => {
    const cipher = await loadFinanceCipher();
    if (!cipher) return;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(cipher, null, 2)], { type: 'application/json' }));
    link.download = `checksport-ingresos-cifrados-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    onToast('Archivo cifrado descargado.', 'success');
  };

  if (!payments) {
    return (
      <div className="standard-view finance-lock-view">
        <section className="finance-lock panel-frame">
          <span className="finance-lock-icon"><LockKeyhole size={27} /></span>
          <h2>Ingresos protegidos</h2>
          <p>La clave se usa solo en este dispositivo para descifrar los movimientos.</p>
          <form onSubmit={unlock}><label>Clave privada<span className="input-with-icon"><KeyRound size={18} /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></span></label><button className="primary-button full-button" disabled={busy}>{busy ? 'Descifrando...' : 'Desbloquear ingresos'}</button></form>
          <span className="security-note"><ShieldCheck size={17} /> AES-GCM 256 · PBKDF2 · 310,000 iteraciones</span>
        </section>
      </div>
    );
  }

  return (
    <div className="standard-view">
      <div className="view-heading"><div><h2>Ingresos</h2><p>Los importes permanecen cifrados cuando la sección está bloqueada.</p></div><div className="heading-actions"><button className="secondary-button" onClick={exportEncrypted}><Download size={18} /> Exportar cifrado</button><button className="primary-button" onClick={() => setAdding(true)}><Plus size={18} /> Registrar ingreso</button></div></div>
      <div className="report-summary finance-summary"><div><span>Total registrado</span><strong>{total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></div><div><span>Movimientos</span><strong>{payments.length}</strong></div><div><span>Estado</span><strong className="encrypted-state"><ShieldCheck size={20} /> Descifrado</strong></div></div>
      <div className="table-frame table-scroll"><table><thead><tr><th>Fecha</th><th>Miembro</th><th>Concepto</th><th>Método</th><th>Importe</th><th>Registró</th></tr></thead><tbody>{payments.map((payment) => <tr key={payment.id}><td>{new Date(payment.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</td><td>{payment.member}</td><td>{payment.concept}</td><td>{payment.method}</td><td><strong>{payment.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong></td><td>{payment.registeredBy}</td></tr>)}{!payments.length && <tr><td className="empty-row" colSpan="6">Todavía no hay ingresos registrados.</td></tr>}</tbody></table></div>
      {adding && <div className="modal-backdrop"><form className="modal-panel payment-modal" onSubmit={savePayment}><div className="modal-heading"><div><h2>Registrar ingreso</h2><p>Se cifrará al guardarlo.</p></div><button type="button" className="icon-button" onClick={() => setAdding(false)} aria-label="Cerrar" title="Cerrar"><X size={20} /></button></div><div className="form-stack"><label>Miembro<input value={draft.member} onChange={(event) => setDraft({ ...draft, member: event.target.value })} autoFocus /></label><label>Concepto<input value={draft.concept} onChange={(event) => setDraft({ ...draft, concept: event.target.value })} /></label><label>Monto<input type="number" min="0" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: event.target.value })} /></label><label>Método<select value={draft.method} onChange={(event) => setDraft({ ...draft, method: event.target.value })}><option>Tarjeta</option><option>Efectivo</option><option>Transferencia</option></select></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setAdding(false)}>Cancelar</button><button className="primary-button">Cifrar y guardar</button></div></form></div>}
    </div>
  );
}
