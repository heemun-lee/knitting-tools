import {useState, useEffect} from 'react';

export const NumberField = ({value, onChange, suffix, min = 1, max}) => {
    const [draft, setDraft] = useState(String(value));
    useEffect(() => {
        setDraft(String(value));
    }, [value]);
    return (
        <div className="input-suffix">
            <input className="input" type="text" inputMode="numeric"
                   value={draft}
                   onChange={e => setDraft(e.target.value)}
                   onBlur={() => {
                       const v = parseInt(draft, 10);
                       if (isNaN(v)) {
                           setDraft(String(value));
                           return;
                       }
                       let clamped = Math.max(min, v);
                       if (max !== undefined) clamped = Math.min(max, clamped);
                       onChange(clamped);
                       setDraft(String(clamped));
                   }}
                   onKeyDown={e => {
                       if (e.key === 'Enter') e.currentTarget.blur();
                   }}/>
            {suffix && <span className="suffix-text">{suffix}</span>}
        </div>
    );
};
