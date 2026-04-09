import { useId } from 'react';
import './Toggle.css';

export function Toggle({ 
  checked = false, 
  onChange,
  label,
  sublabel,
  disabled = false,
  id,
  className = '' 
}) {
  const generatedId = useId();
  const toggleId = id || `toggle-${generatedId.replace(/:/g, '')}`;
  
  return (
    <div className={`toggle-wrapper ${className}`}>
      <div className="toggle">
        <input
          type="checkbox"
          id={toggleId}
          className="toggle__input"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
        />
        <label htmlFor={toggleId} className="toggle__track">
          <span className="toggle__thumb" />
        </label>
      </div>
      {(label || sublabel) && (
        <div className="toggle__content">
          {label && <label htmlFor={toggleId} className="toggle__label">{label}</label>}
          {sublabel && <span className="toggle__sublabel">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}

export default Toggle;
