import './StatCard.css';

export function StatCard({ 
  icon,
  label,
  value,
  hint,
  progress,
  className = '' 
}) {
  return (
    <div className={`stat-card ${className}`}>
      {icon && (
        <div className="stat-card__icon">
          <span className="material-symbols-outlined">{icon}</span>
        </div>
      )}
      
      <label className="stat-card__inner">
        <span className="stat-card__label">{label}</span>
        <div className="stat-card__value-wrapper">
          <input 
            type="number" 
            className="stat-card__value" 
            defaultValue={value}
            placeholder="0"
          />
        </div>
        
        {progress !== undefined && (
          <div className="stat-card__progress">
            <div 
              className="stat-card__progress-bar" 
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {hint && <span className="stat-card__hint">{hint}</span>}
      </label>
    </div>
  );
}

export default StatCard;
