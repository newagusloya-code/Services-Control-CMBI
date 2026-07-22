import { Download, Plus, Save, ShieldCheck, Trash2, Upload } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeTherapyType } from '../lib/domain';

export function SettingsView({ settings, onSave, onPrepareBackups, onCreateBackup, onRestoreBackup, onGetBackupStatus, onToast }) {
  const [prices, setPrices] = useState(settings.therapyPrices ?? {});
  const [draft, setDraft] = useState({ label: '', price: '' });
  const [schedule, setSchedule] = useState(settings.backupSchedule ?? 'manual');
  const [backupPassword, setBackupPassword] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [backupStatus, setBackupStatus] = useState({ configured: false, latestAt: settings.lastBackupAt ?? null });
  const fileInput = useRef(null);
  const priceRows = useMemo(() => Object.entries(prices).sort(([, a], [, b]) => a.label.localeCompare(b.label, 'es')), [prices]);

  useEffect(() => {
    onGetBackupStatus().then(setBackupStatus).catch(() => undefined);
  }, [onGetBackupStatus]);

  useEffect(() => {
    setPrices(settings.therapyPrices ?? {});
    setSchedule(settings.backupSchedule ?? 'manual');
  }, [settings]);

  const addPrice = () => {
    const label = draft.label.trim();
    const price = Number(draft.price);
    if (!label || !Number.isFinite(price) || price < 0) {
      onToast('Escribe un servicio y un precio válido.', 'error');
      return;
    }
    const key = normalizeTherapyType(label);
    setPrices((current) => ({ ...current, [key]: { label, price } }));
    setDraft({ label: '', price: '' });
  };

  const savePrices = async () => {
    const normalized = Object.fromEntries(Object.values(prices).map((item) => [normalizeTherapyType(item.label), { label: item.label.trim(), price: Number(item.price) }]));
    setPrices(normalized);
    await onSave({ therapyPrices: normalized });
    onToast('Precios de Therapy actualizados en Ingresos y Reportes.', 'success');
  };

  const saveBackupSettings = async () => {
    if (schedule !== 'manual' && !backupStatus.configured && backupPassword.length < 8) {
      onToast('Define una clave de respaldo de al menos 8 caracteres.', 'error');
      return;
    }
    if (backupPassword) {
      if (backupPassword.length < 8) {
        onToast('La clave de respaldo debe tener al menos 8 caracteres.', 'error');
        return;
      }
      const status = await onPrepareBackups(backupPassword);
      setBackupStatus(status);
      setBackupPassword('');
    }
    await onSave({ backupSchedule: schedule });
    onToast('Configuración de respaldo guardada.', 'success');
  };

  const createBackup = async () => {
    try {
      const backup = await onCreateBackup();
      setBackupStatus({ configured: true, latestAt: backup.createdAt });
      onToast('Respaldo cifrado descargado.', 'success');
    } catch {
      onToast('Primero configura una clave de respaldo.', 'error');
    }
  };

  const restore = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || restorePassword.length < 8) {
      onToast('Selecciona el archivo y escribe su clave de respaldo.', 'error');
      return;
    }
    try {
      const backup = JSON.parse(await file.text());
      await onRestoreBackup(backup, restorePassword);
      setRestorePassword('');
      setBackupStatus({ configured: true, latestAt: backup.createdAt });
      onToast('Respaldo restaurado correctamente.', 'success');
    } catch {
      onToast('El archivo o la clave de respaldo no son válidos.', 'error');
    }
  };

  return (
    <div className="standard-view settings-view">
      <div className="view-heading"><div><h2>Configuración</h2><p>Precios operativos y protección de los datos locales.</p></div></div>

      <section className="settings-section panel-frame">
        <div className="settings-section-heading"><div><h3>Precios de Therapy</h3><p>El monto vigente se refleja de inmediato en Ingresos y Reportes.</p></div><button className="primary-button" onClick={savePrices}><Save size={17} /> Guardar precios</button></div>
        <div className="price-list">
          {priceRows.map(([key, item]) => (
            <div className="price-row" key={key}>
              <input aria-label="Nombre de terapia" value={item.label} onChange={(event) => {
                const label = event.target.value;
                setPrices((current) => ({ ...current, [key]: { ...current[key], label } }));
              }} />
              <label><span>MXN</span><input aria-label={`Precio de ${item.label}`} type="number" min="0" step="0.01" value={item.price} onChange={(event) => setPrices((current) => ({ ...current, [key]: { ...current[key], price: Number(event.target.value) } }))} /></label>
              <button className="icon-button danger-icon" onClick={() => setPrices((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== key)))} aria-label={`Eliminar ${item.label}`} title="Eliminar"><Trash2 size={17} /></button>
            </div>
          ))}
          {!priceRows.length && <p className="empty-settings">Agrega la primera terapia para comenzar a registrar ingresos.</p>}
        </div>
        <div className="price-add-row">
          <input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} placeholder="Nombre de terapia" />
          <input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="Precio MXN" />
          <button className="secondary-button" onClick={addPrice}><Plus size={17} /> Agregar</button>
        </div>
      </section>

      <section className="settings-section panel-frame">
        <div className="settings-section-heading"><div><h3>Respaldo cifrado</h3><p>Los archivos se descargan en la carpeta Descargas del navegador y se restauran aquí con su clave.</p></div><ShieldCheck size={25} /></div>
        <div className="backup-grid">
          <label>Frecuencia<select value={schedule} onChange={(event) => setSchedule(event.target.value)}><option value="manual">Manual</option><option value="daily">Diario</option><option value="weekly">Semanal</option></select></label>
          <label>Clave del respaldo<input type="password" value={backupPassword} onChange={(event) => setBackupPassword(event.target.value)} placeholder={backupStatus.configured ? 'Dejar vacío para conservar' : 'Mínimo 8 caracteres'} /></label>
          <button className="secondary-button" onClick={saveBackupSettings}><Save size={17} /> Guardar programación</button>
        </div>
        <div className="backup-actions">
          <div><strong>{backupStatus.configured ? 'Cifrado configurado' : 'Falta configurar la clave'}</strong><span>{backupStatus.latestAt ? `Último respaldo: ${new Date(backupStatus.latestAt).toLocaleString('es-MX')}` : 'Todavía no hay un respaldo descargado.'}</span></div>
          <button className="primary-button" onClick={createBackup}><Download size={17} /> Descargar respaldo ahora</button>
        </div>
        <div className="restore-row">
          <label>Clave para restaurar<input type="password" value={restorePassword} onChange={(event) => setRestorePassword(event.target.value)} placeholder="Clave del archivo" /></label>
          <input ref={fileInput} className="sr-only" type="file" accept="application/json,.json" onChange={restore} />
          <button className="secondary-button" onClick={() => fileInput.current?.click()}><Upload size={17} /> Restaurar archivo</button>
        </div>
      </section>
    </div>
  );
}
