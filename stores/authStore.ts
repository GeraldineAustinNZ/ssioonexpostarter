import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string, 
    password: string, 
    metadata?: { [key: string]: any }
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) return { error };
      
      set({ user: data.user, session: data.session });
      
      if (data.user) {
        await get().refreshProfile();
      }
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    }
  },
  
  signUp: async (email, password, metadata) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      if (error) return { error };
      
      set({ user: data.user, session: data.session });
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as Error };
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (!error) {
        set({ user: null, profile: null, session: null });
      }
      
      return { error };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error as Error };
    }
  },
  
  refreshProfile: async () => {
    const { user } = get();
    
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        set({ profile: data });
      }
    } catch (error) {
      console.error('Exception fetching profile:', error);
    } finally {
      set({ loading: false });
    }
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  useAuthStore.setState({ session, user: session?.user || null });
  
  if (session?.user) {
    useAuthStore.getState().refreshProfile();
  } else {
    useAuthStore.setState({ loading: false });
  }
});

// Set up auth state change listener
supabase.auth.onAuthStateChange((event, session) => {
  useAuthStore.setState({ session, user: session?.user || null });
  
  if (session?.user) {
    useAuthStore.getState().refreshProfile();
  } else {
    useAuthStore.setState({ profile: null, loading: false });
  }
});