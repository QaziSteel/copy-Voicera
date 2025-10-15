import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  checkEmailExists: (email: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  sendMagicLink: (email: string, fullName?: string) => Promise<{ error: any }>;
  sendPasswordResetLink: (email: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  verifyCurrentPassword: (currentPassword: string) => Promise<{ error: any }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ error: any }>;
  resetPassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create client with correct storage
    const client = createDynamicSupabaseClient();
    
    // Set up auth state listener
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      const dynamicClient = createDynamicSupabaseClient();
      const { data, error } = await dynamicClient.rpc('check_email_exists', {
        _email: email 
      });
      
      if (error) {
        console.error('Error checking email:', error);
        return false;
      }
      
      return data === true;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const sendMagicLink = async (email: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/auth/complete-signup`;
    
    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const sendPasswordResetLink = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset-password`;
    
    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Use the current domain for the redirect URL (works for both preview and deployed environments)
    const redirectUrl = window.location.origin;
    
    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string, rememberMe: boolean = false) => {
    // Store the remember me preference BEFORE signing in
    if (rememberMe) {
      localStorage.setItem('auth_remember_me', 'true');
    } else {
      localStorage.removeItem('auth_remember_me');
      // Clear any existing session from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Create a new client with the correct storage
    const dynamicClient = createDynamicSupabaseClient();
    
    const { error } = await dynamicClient.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear remember me preference
      localStorage.removeItem('auth_remember_me');
      
      // Clear from both storages
      [localStorage, sessionStorage].forEach(storage => {
        Object.keys(storage).forEach((key) => {
          if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
            storage.removeItem(key);
          }
        });
      });
      
      // Attempt global sign out
      try {
        const dynamicClient = createDynamicSupabaseClient();
        await dynamicClient.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const verifyCurrentPassword = async (currentPassword: string) => {
    if (!user?.email) {
      return { error: { message: 'No email found' } };
    }

    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    
    return { error };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    // First verify current password
    const verifyResult = await verifyCurrentPassword(currentPassword);
    if (verifyResult.error) {
      return { error: { message: 'Current password is incorrect' } };
    }

    // If verification passed, update the password
    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const resetPassword = async (newPassword: string) => {
    // This is used during password reset flow (no current password needed)
    const dynamicClient = createDynamicSupabaseClient();
    const { error } = await dynamicClient.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    checkEmailExists,
    signUp,
    sendMagicLink,
    sendPasswordResetLink,
    signIn,
    signOut,
    verifyCurrentPassword,
    updatePassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};