/* eslint-disable react-refresh/only-export-components */
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../Button';
import './GuestGate.css';

export function GuestGate({ children, feature = 'this feature' }) {
  const { isAnonymous } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAnonymous) {
    return children;
  }

  const handleSignUp = () => {
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <div className="guest-gate">
      <div className="guest-gate__overlay">
        <div className="guest-gate__card">
          <span className="material-symbols-outlined guest-gate__icon">lock</span>
          <h3 className="guest-gate__title">Sign Up to Continue</h3>
          <p className="guest-gate__description">
            Create a free account to use {feature}.
          </p>
          <div className="guest-gate__actions">
            <Button variant="primary" size="md" onClick={handleSignUp}>
              Sign Up Free
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/gallery')}>
              Browse Gallery
            </Button>
          </div>
        </div>
      </div>
      <div className="guest-gate__preview">
        {children}
      </div>
    </div>
  );
}

export function useGuestCheck() {
  const { isAnonymous } = useAuth();
  
  const requireAuth = (callback) => {
    if (isAnonymous) {
      // Could dispatch a custom event or use state management
      const event = new CustomEvent('guest-gate:show', { detail: { callback } });
      window.dispatchEvent(event);
      return false;
    }
    callback();
    return true;
  };

  return { isGuest: isAnonymous, requireAuth };
}

export default GuestGate;
