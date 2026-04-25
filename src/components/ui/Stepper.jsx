import { useTranslation } from 'react-i18next';
import {IconPlus, IconMinus} from '../icons';

export const Stepper = ({value, onChange, min = 0, max = 9999, step = 1, suffix}) => {
    const { t } = useTranslation();
    const inc = () => onChange(Math.min(max, value + step));
    const dec = () => onChange(Math.max(min, value - step));
    return (
        <div className="stepper">
            <button className="stepper-btn" onClick={dec} aria-label={t('stepper.dec')}><IconMinus size={16}/></button>
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
            {suffix && <span style={{paddingRight: 12, color: 'var(--ink-400)', fontSize: 13}}>{suffix}</span>}
            <button className="stepper-btn" onClick={inc} aria-label={t('stepper.inc')}><IconPlus size={16}/></button>
        </div>
    );
};
