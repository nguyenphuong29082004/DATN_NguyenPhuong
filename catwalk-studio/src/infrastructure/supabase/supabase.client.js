import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Singleton
 * Central point for all Supabase database interactions
 * 
 * This is the ONLY place in the Infrastructure layer that creates the Supabase client.
 * All repositories should use getSupabaseClient() to access the database.
 */

let supabaseClient = null;

// In-memory async mutex to serialize Supabase auth operations.
// Avoids browser Lock API stalls (background/frozen tabs) while preventing
// concurrent token refresh races that can corrupt session state.
// Respects acquireTimeout: 0 means "skip if busy" (used by auto-refresh tick),
// positive values mean "wait up to N ms".
let lockChain = Promise.resolve();
let lockBusy = false;

const inMemoryAuthLock = async (_name, acquireTimeout, fn) => {
    // Fast-path: if lock is busy and caller wants to skip (timeout=0), bail.
    if (lockBusy && acquireTimeout === 0) {
        throw Object.assign(new Error('Lock not available'), { isAcquireTimeout: true });
    }

    const waitFor = lockChain.catch(() => {});
    let release;
    lockChain = new Promise((resolve) => { release = resolve; });

    // If there's a positive timeout, race against it
    if (acquireTimeout > 0) {
        let timedOut = false;
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                timedOut = true;
                reject(Object.assign(new Error('Lock acquire timeout'), { isAcquireTimeout: true }));
            }, acquireTimeout);
        });

        try {
            await Promise.race([waitFor, timeoutPromise]);
        } catch (e) {
            if (timedOut) {
                release();
                throw e;
            }
        }
    } else {
        await waitFor;
    }

    lockBusy = true;
    try {
        return await fn();
    } finally {
        lockBusy = false;
        release();
    }
};

/**
 * Initialize and get Supabase client instance
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
    if (!supabaseClient) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

        supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true,
                // Avoid browser lock-manager stalls observed in tab-switch flows.
                lock: inMemoryAuthLock,
            },
        });
    }

    return supabaseClient;
}

/**
 * Check if Supabase is properly configured
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    return !!(url && key && url !== 'https://placeholder.supabase.co' && key !== 'placeholder-key');
}

export default {
    getSupabaseClient,
    isSupabaseConfigured
};
