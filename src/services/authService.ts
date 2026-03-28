/**
 * Authentication Service
 * ======================
 * Handles all authentication operations using Supabase Auth
 * - Email + Password authentication
 * - Session management
 * - Auth state tracking
 */

import { supabase } from '../lib/supabase/client';
import type { User, Session, AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
  isNewUser?: boolean;
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Update last active timestamp
    if (data.user) {
      await updateLastActive(data.user.id);
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
      isNewUser: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign up',
    };
  }
}

/**
 * Sign in existing user with email and password
 */
export async function signIn(email: string, password: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Update last active timestamp
    if (data.user) {
      await updateLastActive(data.user.id);
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign in',
    };
  }
}

/**
 * Legacy: Send magic link (kept for compatibility)
 */
export async function sendMagicLink(email: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send magic link',
    };
  }
}

/**
 * Legacy: Verify OTP (kept for compatibility)
 */
export async function verifyOtp(
  email: string,
  token: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: 'email',
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (data.user) {
      await updateLastActive(data.user.id);
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP',
    };
  }
}

/**
 * Sign out the current user
 * Clears session and local storage
 */
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Clear any app-specific data
    localStorage.removeItem('sigmalog_habits');
    localStorage.removeItem('sigmalog_logs');
    localStorage.removeItem('sigmalog_screen');

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sign out',
    };
  }
}

/**
 * Get current session
 * Returns null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Get current user
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Subscribe to auth state changes
 * Useful for updating UI when user logs in/out
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );

  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
}

/**
 * Update user's last active timestamp
 * Called after successful login and periodically during usage
 */
async function updateLastActive(userId: string): Promise<void> {
  try {
    // Use type assertion since the users table may not exist yet
    await (supabase as any)
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
  } catch (error) {
    console.error('Failed to update last active:', error);
  }
}

/**
 * Refresh session
 * Call this periodically to keep session alive
 */
export async function refreshSession(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      user: data.user ?? undefined,
      session: data.session ?? undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refresh session',
    };
  }
}

/**
 * Ensure user profile exists in public.users table
 * This is needed because the trigger may not fire if user existed before migration
 */
export async function ensureUserProfile(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user || !user.email) return false;

  try {
    // Check if profile exists
    const { data: existing } = await (supabase as any)
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existing) return true;

    // Create profile if doesn't exist
    const { error } = await (supabase as any)
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
      });

    if (error && error.code !== '23505') { // Ignore duplicate key error
      console.error('Failed to create user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return false;
  }
}

/**
 * Get user profile from database
 * This extends beyond the basic auth.users data
 */
export async function getUserProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }

  return data;
}

/**
 * Helper: Format auth errors for user display
 */
export function formatAuthError(error: AuthError | Error | string): string {
  if (typeof error === 'string') return error;

  const message = error instanceof Error ? error.message : 'Authentication failed';

  // Provide user-friendly messages
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or OTP code';
  }
  if (message.includes('Email not confirmed')) {
    return 'Please check your email and verify your account';
  }
  if (message.includes('Token has expired')) {
    return 'OTP code has expired. Please request a new one';
  }
  if (message.includes('Email rate limit exceeded')) {
    return 'Too many attempts. Please try again in a few minutes';
  }

  return message;
}
