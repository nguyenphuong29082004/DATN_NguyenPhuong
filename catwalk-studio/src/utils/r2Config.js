// Utility to fetch private config from Cloudflare R2 via Supabase Edge Function
import { getSupabaseClient } from '../infrastructure/supabase/supabase.client.js';

const supabase = getSupabaseClient();

/**
 * Fetches the remote configuration from private R2 bucket.
 * This calls the 'get-r2-config' Edge Function.
 * @returns {Promise<Object>} The configuration object
 */
export const loadRemoteConfig = async () => {
    try {
        console.log('Loading remote config from R2...');
        const { data, error } = await supabase.functions.invoke('get-r2-config');

        if (error) {
            console.error('Error invoking get-r2-config:', error);
            throw error;
        }

        console.log('Config loaded successfully');
        return data;
    } catch (err) {
        console.error('Failed to load remote config:', err);
        // You might want to return a default config here if critical
        return null;
    }
};
