import { useId } from 'react';
import './Input.css';

export function Input({ 
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon,
  suffix,
  error,
  success,
  hint,
  disabled = false,
  id,
  className = '' 
}) {
  const generatedId = useId();
  const inputId = id || `input-${generatedId.replace(/:/g, '')}`;
  
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${success ? 'input-group--success' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-group__label">
          {label}
        </label>
      )}
      
      <div className="input-group__wrapper">
        {icon && (
          <span className="input-group__icon material-symbols-outlined">{icon}</span>
        )}
        
        <input
          id={inputId}
          type={type}
          className="input-group__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        />
        
        {(suffix || success) && (
          <div className="input-group__suffix">
            {success && <span className="material-symbols-outlined input-group__success-icon">check_circle</span>}
            {suffix}
          </div>
        )}
      </div>
      
      {(hint || error) && (
        <span className={`input-group__hint ${error ? 'input-group__hint--error' : ''}`}>
          {error || hint}
        </span>
      )}
    </div>
  );
}

export default Input;
