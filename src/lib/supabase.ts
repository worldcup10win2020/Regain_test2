import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey);
}

// Create a lazy-initialized Supabase client that only connects when configured
let _supabase: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      if (!isSupabaseConfigured()) {
        // Return a mock for unconfigured state
        if (prop === 'auth') {
          return {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
            signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
            signOut: () => Promise.resolve({ error: null }),
            admin: {
              createUser: () => Promise.resolve({ data: null, error: { message: 'Not configured' } }),
            },
          };
        }
        if (prop === 'from') {
          return () => ({
            select: () => ({ data: [], error: null, eq: () => ({ data: [], error: null, single: () => ({ data: null, error: null }), order: () => ({ data: [], error: null }) }), order: () => ({ data: [], error: null }) }),
            insert: () => ({ data: null, error: null, select: () => ({ single: () => ({ data: null, error: null }) }) }),
            update: () => ({ data: null, error: null, eq: () => ({ data: null, error: null, select: () => ({ single: () => ({ data: null, error: null }) }) }) }),
            delete: () => ({ data: null, error: null, eq: () => ({ data: null, error: null }) }),
          });
        }
        return undefined;
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
    return (_supabase as unknown as Record<string, unknown>)[prop as string];
  },
});
