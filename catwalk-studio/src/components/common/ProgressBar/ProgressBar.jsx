import './ProgressBar.css';

export function ProgressBar({ 
  value = 0, 
  label = 'Progress',
  showPercentage = true,
  size = 'sm',
  className = '' 
}) {
  const percentage = Math.min(100, Math.max(0, value));
  
  return (
    <div className={`progress ${className}`}>
      <div className="progress__header">
        <span className="progress__label">{label}</span>
        {showPercentage && (
          <span className="progress__value">{percentage}%</span>
        )}
      </div>
      <div className={`progress__track progress__track--${size}`}>
        <div 
          className="progress__bar" 
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
}

export default ProgressBar;
