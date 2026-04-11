import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '../../components/common/Button';
import './LoginPage.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const { t } = useLanguage();

  const { isAnonymous, signInWithGoogle, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const redirectTo = location.state?.from || localStorage.getItem('auth_redirect') || '/studio';

  useEffect(() => {
    if (user && !isAnonymous) {
      localStorage.removeItem('auth_redirect');
      navigate(redirectTo, { replace: true });
    }
  }, [user, isAnonymous, navigate, redirectTo]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      // Save redirect path before OAuth redirect
      const targetPath = location.state?.from || '/studio';
      localStorage.setItem('auth_redirect', targetPath);
      
      const { error: authError } = await signInWithGoogle();
      if (authError) {
        setError(authError.message);
        setGoogleLoading(false);
      }
      // If success, will redirect to Google, no need to set loading false
    } catch {
      setError(t('auth.googleSignInFailed'));
      setGoogleLoading(false);
    }
  };

  return (
    <div className="login-page">
      <main className="login-main">
        <div className="step-header">
          <h2>{t('auth.signIn')}</h2>
          <p>{t('auth.chooseMethod')}</p>
        </div>

        <div className="login-card">
          {error && (
            <div className="login-error">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          {GOOGLE_CLIENT_ID && (
            <>
              <button 
                className="google-signin-button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>{t('auth.continueWithGoogle')}</span>
              </button>
              {googleLoading && <p className="google-loading">{t('auth.signingIn')}</p>}

              <div className="login-divider">
                <span>{t('common.or')}</span>
              </div>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => navigate(redirectTo, { replace: true })}
            icon="person"
          >
            {t('auth.continueAsGuest')}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
