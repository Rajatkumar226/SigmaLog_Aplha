/**
 * Supabase Client Configuration
 * ================================
 * Initializes the Supabase client for authentication and database operations.
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Get your project URL and anon key from Settings > API
 * 3. Create a .env.local file in the root directory
 * 4. Add the following environment variables:
 *    VITE_SUPABASE_URL=your-project-url
 *    VITE_SUPABASE_ANON_KEY=your-anon-key
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please create a .env.local file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase client instance
 * - Auto-handles authentication state
 * - Enforces Row Level Security (RLS) policies
 * - All queries are automatically scoped to the authenticated user
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session from URL (for magic link auth)
    detectSessionInUrl: true,
  },
});

/**
 * Helper function to get the current server date
 * This ensures consistency across timezones
 */
export async function getCurrentServerDate(): Promise<string> {
  const { data, error } = await supabase.rpc('get_current_date');

  if (error) {
    // Fallback to client date if RPC fails
    console.warn('Failed to get server date, using client date:', error);
    return new Date().toISOString().split('T')[0];
  }

  return data;
}

/**
 * Helper function to check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return session !== null;
}

/**
 * Helper function to get current user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Helper function to get current user email
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email ?? null;
}
