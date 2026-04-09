import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RequireAuth — Route guard that requires a real (non-guest) authenticated user.
 * Redirects to /login if user is not authenticated or is a guest.
 */
export const RequireAuth = ({ children }) => {
    const { user, initialized, isGuest } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (initialized && (!user || isGuest)) {
            navigate('/login', { replace: true, state: { from: window.location.pathname } });
        }
    }, [initialized, user, isGuest, navigate]);

    // Show nothing while checking auth or if not authorized
    if (!initialized || !user || isGuest) {
        return null;
    }

    return children;
};

export default RequireAuth;
