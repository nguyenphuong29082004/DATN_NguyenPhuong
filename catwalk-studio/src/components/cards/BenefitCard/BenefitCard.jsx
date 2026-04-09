import './BenefitCard.css';

export function BenefitCard({ 
  icon,
  title,
  description,
  className = '' 
}) {
  return (
    <div className={`benefit-card ${className}`}>
      <div className="benefit-card__icon">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div className="benefit-card__content">
        <h4 className="benefit-card__title">{title}</h4>
        <p className="benefit-card__description">{description}</p>
      </div>
    </div>
  );
}

export default BenefitCard;
