import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { IconCheck, IconPlus, IconMinus } from './icons';

/* ---- Toast system ---- */
const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, icon: opts.icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 2400);
  }, []);
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            {t.icon || <IconCheck size={16} stroke={2.4} />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

/* ---- Stepper (number input with +/- buttons) ---- */
export const Stepper = ({ value, onChange, min = 0, max = 9999, step = 1, suffix }) => {
  const inc = () => onChange(Math.min(max, value + step));
  const dec = () => onChange(Math.max(min, value - step));
  return (
    <div className="stepper">
      <button className="stepper-btn" onClick={dec} aria-label="감소"><IconMinus size={16} /></button>
      <input
        className="stepper-input"
        type="number"
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          else if (e.target.value === '') onChange(min);
        }}
      />
      {suffix && <span style={{ paddingRight: 12, color: 'var(--ink-400)', fontSize: 13 }}>{suffix}</span>}
      <button className="stepper-btn" onClick={inc} aria-label="증가"><IconPlus size={16} /></button>
    </div>
  );
};

/* ---- Modal ---- */
export const Modal = ({ open, onClose, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        {title && <h3 className="modal-title">{title}</h3>}
        <div className="modal-text">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
};

/* ---- localStorage hook ---- */
export const useLocal = (key, init) => {
  const [v, setV] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : init;
    } catch { return init; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v]);
  return [v, setV];
};
