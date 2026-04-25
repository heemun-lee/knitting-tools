import {useState, useEffect} from 'react';

export const useLocal = (key, init) => {
    const [v, setV] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : init;
        } catch {
            return init;
        }
    });
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(v));
        } catch {
        }
    }, [key, v]);
    return [v, setV];
};
