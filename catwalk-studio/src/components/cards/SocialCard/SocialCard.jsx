import './SocialCard.css';
import { Button } from '../../common';

export function SocialCard({ 
  name,
  icon,
  iconColor,
  connected = false,
  username,
  onConnect,
  onDisconnect,
  className = '' 
}) {
  return (
    <div className={`social-card ${connected ? 'social-card--connected' : ''} ${className}`}>
      <div className="social-card__left">
        <div 
          className="social-card__icon"
          style={{ background: iconColor }}
        >
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="social-card__info">
          <span className="social-card__name">{name}</span>
          {connected ? (
            <span className="social-card__status">
              <span className="social-card__status-dot" />
              Connected{username && ` • @${username}`}
            </span>
          ) : (
            <span className="social-card__status social-card__status--disconnected">
              Not connected
            </span>
          )}
        </div>
      </div>
      
      <div className="social-card__right">
        {connected ? (
          <button 
            className="social-card__menu"
            onClick={onDisconnect}
            aria-label="More options"
          >
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        ) : (
          <Button 
            variant="secondary" 
            size="sm"
            icon="arrow_forward"
            onClick={onConnect}
          >
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}

export default SocialCard;
