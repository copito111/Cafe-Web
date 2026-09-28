export function ToastNotice({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live={toast.type === 'error' ? 'assertive' : 'polite'}>
      <span className="toast-mark" aria-hidden="true">{toast.type === 'error' ? '!' : '✓'}</span>
      <p>{toast.message}</p>
      <button type="button" onClick={onClose} aria-label="Cerrar notificación">×</button>
    </div>
  );
}