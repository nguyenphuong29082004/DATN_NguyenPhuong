import { useId } from 'react';
import './Textarea.css';

export function Textarea({ 
  label,
  placeholder,
  value,
  onChange,
  maxLength,
  rows = 6,
  hint,
  aiGenerate,
  onAiGenerate,
  id,
  className = '' 
}) {
  const generatedId = useId();
  const textareaId = id || `textarea-${generatedId.replace(/:/g, '')}`;
  const charCount = value?.length || 0;
  
  return (
    <div className={`textarea-group ${className}`}>
      <div className="textarea-group__header">
        {label && (
          <label htmlFor={textareaId} className="textarea-group__label">
            {label}
          </label>
        )}
        
        {aiGenerate && (
          <button 
            type="button"
            className="textarea-group__ai-btn"
            onClick={onAiGenerate}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Generate with AI
          </button>
        )}
      </div>
      
      <div className="textarea-group__wrapper">
        <textarea
          id={textareaId}
          className="textarea-group__input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={rows}
          maxLength={maxLength}
        />
        
        <div className="textarea-group__corner textarea-group__corner--tl" />
        <div className="textarea-group__corner textarea-group__corner--tr" />
        <div className="textarea-group__corner textarea-group__corner--bl" />
        <div className="textarea-group__corner textarea-group__corner--br" />
        
        {maxLength && (
          <div className="textarea-group__counter">
            {charCount} / {maxLength}
          </div>
        )}
      </div>
      
      {hint && <span className="textarea-group__hint">{hint}</span>}
    </div>
  );
}

export default Textarea;
