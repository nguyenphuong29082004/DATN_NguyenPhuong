import './Slider.css';

export function Slider({ 
  label,
  value = 0,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  formatValue,
  prefix,
  suffix,
  showRange = true,
  hint,
  className = '' 
}) {
  const percentage = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : value;
  
  return (
    <div className={`slider-group ${className}`}>
      {label && <span className="slider-group__label">{label}</span>}
      
      <div className="slider-group__value-display">
        {prefix && <span className="slider-group__prefix">{prefix}</span>}
        <span className="slider-group__value">{displayValue}</span>
        {suffix && <span className="slider-group__suffix">{suffix}</span>}
      </div>
      
      <div className="slider-group__control">
        {showRange && (
          <div className="slider-group__range">
            <span>{prefix}{formatValue ? formatValue(min) : min}</span>
            <span>{prefix}{formatValue ? formatValue(max) : max}{max >= 20000 ? '+' : ''}</span>
          </div>
        )}
        
        <div className="slider-group__track-wrapper">
          <div className="slider-group__track">
            <div 
              className="slider-group__fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          <div 
            className="slider-group__thumb"
            style={{ left: `${percentage}%` }}
          >
            <div className="slider-group__thumb-inner" />
          </div>
          
          <input
            type="range"
            className="slider-group__input"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange?.(Number(e.target.value))}
          />
        </div>
        
        {hint && <p className="slider-group__hint">{hint}</p>}
      </div>
    </div>
  );
}

export default Slider;
