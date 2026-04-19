/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { getDeviceFingerprint } from '../utils/device-id';

const AUTH_TIMEOUT_MS = 8000;
const AUTH_INIT_SESSION_TIMEOUT_MS = 2500;
const supabase = getSupabaseClient();

function withTimeout(promise, timeoutMs, errorMessage) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
}

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const isCreatingAnonUser = useRef(false);
    const loadingRef = useRef(true);

    useEffect(() => {
        loadingRef.current = loading;
    }, [loading]);

    // ========================================================
    // Profile data helpers (used outside auth lock context)
    // ========================================================

    const fetchProfile = useCallback(async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }, []);

    const createGuestProfile = useCallback(async (userId) => {
        try {
            let fingerprint = null;
            try {
                fingerprint = await getDeviceFingerprint();
            } catch {
                fingerprint = 'fp_unavailable';
            }

            const { data, error } = await supabase
                .rpc('get_or_create_guest', {
                    p_user_id: userId,
                    p_fingerprint: fingerprint
                })
                .single();

            if (error) {
                console.error('Error creating guest profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error creating guest profile:', error);
            return null;
        }
    }, []);

    const createRegisteredProfile = useCallback(async (userId, email) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert({
                    user_id: userId,
                    email: email,
                    credits_balance: 100,
                    is_guest: false
                })
                .select()
                .single();

            if (error) {
                console.error('Error creating profile:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error creating profile:', error);
            return null;
        }
    }, []);

    // ========================================================
    // Profile hydration effect — runs OUTSIDE auth lock
    // This is the KEY fix: profile loading is decoupled from
    // onAuthStateChange callback, preventing deadlocks when
    // Supabase holds the auth lock and awaits our callback
    // which then tries to call Supabase again.
    // ========================================================

    useEffect(() => {
        let cancelled = false;

        const hydrateProfile = async () => {
            if (!user) {
                setProfile(null);
                return;
            }

            try {
                let userProfile = await fetchProfile(user.id);

                if (cancelled) return;

                // Convert guest to registered user if needed
                if (userProfile?.is_guest && user.email && !user.is_anonymous) {
                    const { data: converted } = await supabase
                        .rpc('convert_guest_to_user', {
                            p_user_id: user.id,
                            p_email: user.email
                        })
                        .single();
                    if (!cancelled && converted) {
                        userProfile = converted;
                    }
                }

                if (cancelled) return;

                // Create profile if none exists
                if (!userProfile) {
                    userProfile = user.is_anonymous === true
                        ? await createGuestProfile(user.id)
                        : await createRegisteredProfile(user.id, user.email);
                }

                if (!cancelled && userProfile) {
                    setProfile(userProfile);
                }
            } catch (error) {
                console.error('[Auth] Profile hydration error:', error);
            }
        };

        hydrateProfile();

        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- we intentionally track user sub-fields, not the full user object reference (which changes on every token refresh)
    }, [user?.id, user?.email, user?.is_anonymous, fetchProfile, createGuestProfile, createRegisteredProfile]);

    // ========================================================
    // Auth actions
    // ========================================================

    const signUp = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            if (data.user) {
                let existingProfile = await fetchProfile(data.user.id);
                if (!existingProfile) {
                    existingProfile = await createRegisteredProfile(data.user.id, email);
                }
                return { user: data.user, profile: existingProfile, error: null };
            }

            return { user: null, profile: null, error: null };
        } catch (error) {
            return { user: null, profile: null, error };
        }
    };

    const signIn = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            return { user: data.user, error: null };
        } catch (error) {
            return { user: null, error };
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/login`
                }
            });

            if (error) throw error;

            return { error: null };
        } catch (error) {
            return { error };
        }
    };

    const refreshProfile = async () => {
        if (user) {
            const updatedProfile = await fetchProfile(user.id);
            setProfile(updatedProfile);
        }
    };

    const updateProfile = async (updates) => {
        if (!user) return { error: new Error('User not authenticated') };

        try {
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setProfile(data);
            }
            return { data, error: null };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { data: null, error };
        }
    };

    // explicit signInAsGuest for studio access
    const signInAsGuest = async () => {
        if (!isSupabaseConfigured() || user || (initialized && !loading && isCreatingAnonUser.current)) return { user: null };
        isCreatingAnonUser.current = true;
        try {
            const { data, error } = await supabase.auth.signInAnonymously();

            if (!error && data?.user) {
                // setUser will trigger profile hydration via useEffect
                setUser(data.user);
                return { user: data.user, error: null };
            }
            return { user: null, error };
        } catch (error) {
            console.error('Error signing in as guest:', error);
            return { user: null, error };
        } finally {
            isCreatingAnonUser.current = false;
        }
    };

    // Helper to finish loading
    const finishLoading = () => {
        loadingRef.current = false;
        setLoading(false);
        setInitialized(true);
    };

    // ========================================================
    // Auth initialization & state listener
    //
    // CRITICAL: The onAuthStateChange callback must be SYNCHRONOUS
    // (no await on Supabase calls). Supabase holds its auth lock
    // while awaiting this callback. If the callback calls Supabase
    // again (e.g. supabase.from().select() which needs auth token
    // via getSession() which needs the lock), it creates a DEADLOCK.
    //
    // Solution: callback only does setUser(). Profile hydration
    // happens in a separate useEffect triggered by user change.
    // ========================================================

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            if (!isSupabaseConfigured()) {
                if (mounted) finishLoading();
                return;
            }

            try {
                const { data: { session } } = await withTimeout(
                    supabase.auth.getSession(),
                    AUTH_INIT_SESSION_TIMEOUT_MS,
                    '[Auth] getSession timed out'
                );

                if (!mounted) return;

                // Auto-login as guest if visiting /studio or model registration and no session
                if (
                    !session?.user &&
                    (window.location.pathname.startsWith('/studio') ||
                        window.location.pathname.startsWith('/models/register'))
                ) {
                    if (mounted) {
                        try {
                            const { data, error } = await supabase.auth.signInAnonymously();
                            if (!error && data?.user) {
                                setUser(data.user);
                            }
                        } catch (guestErr) {
                            console.error('[Auth] auto-guest login error:', guestErr);
                        }
                    }
                } else if (session?.user) {
                    setUser(session.user);
                }
            } catch (error) {
                // getSession can stall in some browser/tab states;
                // INITIAL_SESSION event remains the source of truth.
                console.warn('[Auth] init fallback to auth-state events:', error);
            } finally {
                if (mounted) finishLoading();
            }
        };

        // Safety net: force finish loading after timeout so UI never hangs
        const timeoutId = setTimeout(() => {
            if (mounted && loadingRef.current) {
                console.warn('Auth init timed out');
                finishLoading();
            }
        }, AUTH_TIMEOUT_MS);

        initAuth();

        // Listen for auth state changes (sign in, sign out, token refresh)
        // IMPORTANT: This callback is called while Supabase holds the auth lock.
        // Do NOT call any Supabase API (from(), rpc(), auth.getSession()) here.
        // Only update React state. Profile work happens in the useEffect above.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (!mounted) return;

                if (
                    event === 'INITIAL_SESSION' ||
                    event === 'SIGNED_IN' ||
                    event === 'TOKEN_REFRESHED' ||
                    event === 'USER_UPDATED'
                ) {
                    if (session?.user) {
                        setUser(session.user);
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                }
            }
        );

        return () => {
            mounted = false;
            isCreatingAnonUser.current = false;
            clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    const isAnonymous = user?.is_anonymous === true || profile?.is_guest === true;

    const value = {
        user,
        profile,
        loading,
        initialized,
        isAnonymous,
        isGuest: isAnonymous,
        creditBalance: profile?.credits_balance ?? 0,
        signUp,
        signIn,
        signOut,
        signInAsGuest,
        signInWithGoogle,
        refreshProfile,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
