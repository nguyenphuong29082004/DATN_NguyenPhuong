import './SelectionCard.css';

export function SelectionCard({ 
  name,
  value,
  image,
  icon,
  label,
  title,
  description,
  selected = false,
  onChange,
  className = '' 
}) {
  const handleChange = () => {
    onChange?.(value);
  };

  return (
    <label className={`selection-card ${selected ? 'selection-card--selected' : ''} ${className}`}>
      <input 
        type="radio" 
        name={name}
        value={value}
        checked={selected}
        onChange={handleChange}
        className="sr-only"
      />
      
      <div className="selection-card__inner">
        <div className="selection-card__image-wrapper">
          <div 
            className="selection-card__image"
            style={{ backgroundImage: `url(${image})` }}
          />
          <div className="selection-card__overlay" />
          
          {icon && (
            <div className="selection-card__icon-badge">
              <span className="material-symbols-outlined">{icon}</span>
            </div>
          )}
        </div>
        
        <div className="selection-card__content">
          <div className="selection-card__indicator" />
          
          <div className="selection-card__text">
            {label && (
              <span className="selection-card__label">{label}</span>
            )}
            <h3 className="selection-card__title">{title}</h3>
            <p className="selection-card__description">{description}</p>
          </div>
          
          <div className="selection-card__action">
            <span className="material-symbols-outlined">arrow_forward</span>
            <span className="selection-card__action-text">Select Profile</span>
          </div>
        </div>
      </div>
    </label>
  );
}

export default SelectionCard;
