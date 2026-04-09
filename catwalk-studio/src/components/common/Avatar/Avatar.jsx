import './Avatar.css';

export function Avatar({ 
  src, 
  alt = 'Avatar',
  size = 'md',
  fallback,
  className = '' 
}) {
  const initials = fallback || alt.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return (
    <div className={`avatar avatar--${size} ${className}`}>
      {src ? (
        <img src={src} alt={alt} className="avatar__image" />
      ) : (
        <span className="avatar__fallback">{initials}</span>
      )}
    </div>
  );
}

export default Avatar;
