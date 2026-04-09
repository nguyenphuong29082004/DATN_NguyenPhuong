import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * RequireSession — Ensures any Supabase session (anonymous guest or registered).
 * Creates a guest session when the visitor has none, so JWT-backed uploads and
 * edge functions work without forcing email login.
 */
export const RequireSession = ({ children }) => {
    const { user, initialized, signInAsGuest } = useAuth();

    useEffect(() => {
        if (initialized && !user) {
            signInAsGuest();
        }
    }, [initialized, user, signInAsGuest]);

    if (!initialized || !user) {
        return null;
    }

    return children;
};

export default RequireSession;
