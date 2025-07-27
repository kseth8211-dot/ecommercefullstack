import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, isSupabaseConfigured } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase!.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase!.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Create profile if it doesn't exist
        if (error.code === 'PGRST116') {
          const user = await supabase!.auth.getUser();
          if (user.data.user) {
            const { data: newProfile } = await supabase!
              .from('profiles')
              .insert({
                id: user.data.user.id,
                email: user.data.user.email!,
                full_name: user.data.user.user_metadata?.full_name || '',
              })
              .select()
              .single();
            setProfile(newProfile);
          }
        }
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Please connect to Supabase first' } };
    }
    const { error } = await supabase!.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!isSupabaseConfigured()) {
      return { error: { message: 'Please connect to Supabase first' } };
    }
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }
    const { error } = await supabase!.auth.signOut();
    return { error };
  };

  return {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  };
}