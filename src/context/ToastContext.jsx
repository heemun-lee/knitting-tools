import {useState, useCallback, createContext} from 'react';
import {IconCheck} from '../components/icons';

export const ToastContext = createContext(null);

export const ToastProvider = ({children}) => {
    const [toasts, setToasts] = useState([]);
    const push = useCallback((msg, opts = {}) => {
        const id = Math.random().toString(36).slice(2);
        setToasts(t => [...t, {id, msg, icon: opts.icon}]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), opts.duration || 2400);
    }, []);
    return (
        <ToastContext.Provider value={push}>
            {children}
            <div className="toast-wrap">
                {toasts.map(t => (
                    <div key={t.id} className="toast">
                        {t.icon || <IconCheck size={16} stroke={2.4}/>}
                        <span>{t.msg}</span>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
