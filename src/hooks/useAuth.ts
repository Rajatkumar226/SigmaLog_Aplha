/**
 * useAuth Hook
 * =============
 * React hook for managing authentication state
 *
 * USAGE:
 * const { user, session, loading, signIn, signOut } = useAuth();
 */

import { useState, useEffect } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import * as authService from '../services/authService';

export interface UseAuthResult {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string) => Promise<authService.AuthResponse>;
  verifyOtp: (email: string, token: string) => Promise<authService.AuthResponse>;
  signOut: () => Promise<authService.AuthResponse>;
  refreshSession: () => Promise<authService.AuthResponse>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);
        if (currentSession) {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // Ensure user profile exists in public.users table
          await authService.ensureUserProfile();
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Subscribe to auth changes
    const unsubscribe = authService.onAuthStateChange(async (event, newSession) => {
      console.log('Auth state changed:', event);
      setSession(newSession);
      if (newSession) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        // Ensure user profile exists when auth state changes
        await authService.ensureUserProfile();
      } else {
        setUser(null);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const signIn = async (email: string) => {
    return await authService.sendMagicLink(email);
  };

  const verifyOtp = async (email: string, token: string) => {
    const response = await authService.verifyOtp(email, token);
    if (response.success && response.user) {
      setUser(response.user);
      setSession(response.session || null);
    }
    return response;
  };

  const signOut = async () => {
    const response = await authService.signOut();
    if (response.success) {
      setUser(null);
      setSession(null);
    }
    return response;
  };

  const refreshSession = async () => {
    const response = await authService.refreshSession();
    if (response.success) {
      setSession(response.session || null);
      setUser(response.user || null);
    }
    return response;
  };

  return {
    user,
    session,
    loading,
    isAuthenticated: session !== null,
    signIn,
    verifyOtp,
    signOut,
    refreshSession,
  };
}
