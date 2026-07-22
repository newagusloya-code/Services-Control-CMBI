import { CheckCircle2, CircleAlert, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;
  const Icon = toast.tone === 'error' ? CircleAlert : CheckCircle2;
  return (
    <div className={`toast toast-${toast.tone}`} role="status">
      <Icon size={19} />
      <span>{toast.message}</span>
      <button className="icon-button" onClick={onClose} aria-label="Cerrar aviso" title="Cerrar aviso">
        <X size={18} />
      </button>
    </div>
  );
}
