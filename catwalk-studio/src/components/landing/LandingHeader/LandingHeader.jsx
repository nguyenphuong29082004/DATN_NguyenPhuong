import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks';
import { useTranslation } from 'react-i18next';
import { handleAppDownloadLinkClick } from '../../../utils/appDownloadRedirect';
import LanguageToggle from '../../common/LanguageToggle/LanguageToggle';

export function LandingHeader({ className = '' }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, isAnonymous } = useAuth();
  const { t } = useTranslation();

  // Sync with scroll on mount and whenever route changes
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const handleGetAppClick = (event) => {
    handleAppDownloadLinkClick(event, {
      userAgent: navigator.userAgent,
      hasMSStream: Boolean(window.MSStream),
      navigate,
      replaceLocation: (url) => {
        window.location.href = url;
      },
    });
  };

  return (
    <header className={`nav-fixed ${scrolled ? 'nav-scrolled' : ''} ${className}`}>
      <div className="container-wide nav-container">
        <Link to="/" className="nav-logo">
          <span className="material-symbols-outlined nav-logo-icon thin-icon">adjust</span>
          <span className="nav-logo-text">Catwalk.AI</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="nav-links">
          <NavLink to="/studio" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            {t('nav.studio')}
            <span className="nav-link-dot"></span>
          </NavLink>
          <NavLink to="/models" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.models')}</NavLink>
          <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.gallery')}</NavLink>
        </nav>

        <div className="nav-actions">
          <LanguageToggle />
          <Link to="/app" className="nav-app-link" onClick={handleGetAppClick}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginBottom: '2px' }}>
              <path d="M18.71,19.5C17.88,20.74,17,21.95,15.66,22c-1.28,0.02-1.69-0.78-3.15-0.78c-1.47,0-1.92,0.76-3.14,0.8c-1.28,0.05-2.27-1.31-3.12-2.54 c-1.73-2.53-3.05-7.14-1.28-10.2c0.88-1.52,2.44-2.48,4.12-2.51c1.28-0.02,2.48,0.87,3.26,0.87c0.78,0,2.26-1.07,3.81-0.91 c0.65,0.03,2.47,0.26,3.64,1.98c-0.09,0.06-2.17,1.28-2.15,3.81c0.03,3.02,2.65,4.03,2.68,4.04C21.03,16.29,20,17.63,18.71,19.5z M15.54,5.07c0.69-0.84,1.16-2.01,1.03-3.17c-0.99,0.04-2.2,0.67-2.91,1.49c-0.64,0.73-1.2,1.92-1.05,3.05 C13.65,6.53,14.85,5.92,15.54,5.07z" />
            </svg>
            <span>{t('nav.getApp')}</span>
          </Link>
          {user && !isAnonymous ? (
            <div
              className="nav-user-profile"
              onClick={() => navigate('/studio/account')}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '8px 16px', borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <span className="material-symbols-outlined thin-icon" style={{ fontSize: '20px' }}>account_circle</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{profile?.email || 'User'}</span>
            </div>
          ) : (
            <button className="btn-accent" onClick={() => navigate('/login')}>
              {t('nav.login')}
            </button>
          )}

          {/* Hamburger Button */}
          <button
            className="nav-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined">{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop - click to close */}
      <div
        className={`nav-mobile-backdrop ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Panel */}
      <nav className={`nav-mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ padding: '0 24px 24px', display: 'flex', justifyContent: 'center' }}>
          <LanguageToggle />
        </div>
        <NavLink to="/studio" className="nav-link-mobile" onClick={() => setIsMenuOpen(false)}>{t('nav.studio')}</NavLink>
        <NavLink to="/models" className="nav-link-mobile" onClick={() => setIsMenuOpen(false)}>{t('nav.models')}</NavLink>
        <NavLink to="/gallery" className="nav-link-mobile" onClick={() => setIsMenuOpen(false)}>{t('nav.gallery')}</NavLink>

        <div className="nav-mobile-cta">
          {user && !isAnonymous ? (
            <div
              className="nav-user-profile-mobile"
              onClick={() => { setIsMenuOpen(false); navigate('/studio/account'); }}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px 24px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', justifyContent: 'center' }}
            >
              <span className="material-symbols-outlined thin-icon" style={{ fontSize: '24px' }}>account_circle</span>
              <span style={{ fontSize: '16px', fontWeight: '500' }}>{profile?.email || 'User'}</span>
            </div>
          ) : (
            <button className="btn-accent" onClick={() => { setIsMenuOpen(false); navigate('/login'); }}>
              {t('nav.login')}
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default LandingHeader;
