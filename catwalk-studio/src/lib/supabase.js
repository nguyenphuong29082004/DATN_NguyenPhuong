/**
 * Re-export Supabase helpers from infrastructure layer
 * 
 * Prefer using repositories through DI container instead of direct Supabase access.
 */

export { getSupabaseClient, isSupabaseConfigured } from '../infrastructure/supabase/supabase.client';
