'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { Profile } from './types';
import { demoProfiles, demoCredentials } from './demo-data';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  isDemo: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({}),
  signOut: async () => {},
  isDemo: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemo = !isSupabaseConfigured();

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    if (isDemo) {
      const profile = demoProfiles.find(p => p.id === userId);
      return profile || null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as Profile;
  }, [isDemo]);

  useEffect(() => {
    if (isDemo) {
      // Check localStorage for demo session
      const stored = localStorage.getItem('regain_demo_user');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          // ignore
        }
      }
      setLoading(false);
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchProfile(session.user.id).then(profile => {
          setUser(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo, fetchProfile]);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    if (isDemo) {
      const cred = demoCredentials.find(c => c.email === email && c.password === password);
      if (!cred) {
        return { error: 'メールアドレスまたはパスワードが正しくありません' };
      }
      const profile = demoProfiles.find(p => p.email === email);
      if (profile) {
        setUser(profile);
        localStorage.setItem('regain_demo_user', JSON.stringify(profile));
      }
      return {};
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: 'メールアドレスまたはパスワードが正しくありません' };
    }
    return {};
  };

  const signOut = async () => {
    if (isDemo) {
      setUser(null);
      localStorage.removeItem('regain_demo_user');
      return;
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, isDemo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
