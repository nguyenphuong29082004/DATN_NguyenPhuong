import './Chip.css';

export function Chip({ 
  children, 
  variant = 'default',
  selected = false,
  removable = false,
  onRemove,
  onClick,
  icon,
  className = '' 
}) {
  const classes = [
    'chip',
    `chip--${variant}`,
    selected && 'chip--selected',
    onClick && 'chip--clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} onClick={onClick}>
      {icon && <span className="material-symbols-outlined chip__icon">{icon}</span>}
      <span className="chip__label">{children}</span>
      {removable && (
        <button 
          className="chip__remove" 
          onClick={(e) => { e.stopPropagation(); onRemove?.(); }}
          aria-label="Remove"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      )}
    </span>
  );
}

export default Chip;
