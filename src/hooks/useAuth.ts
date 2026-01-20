import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { auth } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Check for existing session
    auth.getCurrentUser().then(({ user, error }) => {
      if (error) {
        setError(error);
      } else {
        setUser(user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await auth.signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    setUser(data.user);
    setLoading(false);
    return { data, error: null };
  };

  const signup = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    setError(null);
    const { data, error } = await auth.signUp(email, password, fullName);
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    setUser(data.user);
    setLoading(false);
    return { data, error: null };
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await auth.signOut();
    if (error) {
      setError(error);
      setLoading(false);
      return { error };
    }
    setUser(null);
    setLoading(false);
    return { error: null };
  };

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
  };
}