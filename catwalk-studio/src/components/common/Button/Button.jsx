import './Button.css';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  loading = false,
  className = '',
  ...props 
}) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full',
    loading && 'btn--loading',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled || loading} {...props}>
      {loading && <span className="btn__spinner" />}
      {!loading && icon && iconPosition === 'left' && (
        <span className="material-symbols-outlined btn__icon">{icon}</span>
      )}
      {children && <span className="btn__text">{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="material-symbols-outlined btn__icon">{icon}</span>
      )}
    </button>
  );
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'sm',
  className = '',
  ...props
}) {
  const classes = [
    'btn',
    'btn--icon-only',
    `btn--${variant}`,
    `btn--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      <span className="material-symbols-outlined btn__icon">{icon}</span>
    </button>
  );
}

export default Button;
