import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  checkEmailExists: (email: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  sendMagicLink: (email: string, fullName?: string) => Promise<{ error: any }>;
  sendPasswordResetLink: (email: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Try to sign in with a dummy password to check if email exists
      // Supabase will return different errors for existing vs non-existing emails
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: 'dummy-password-for-check-only'
      });
      
      // If error message indicates invalid credentials, the email exists
      // If error indicates user not found, the email doesn't exist
      if (error) {
        // "Invalid login credentials" means email exists but password is wrong
        if (error.message.toLowerCase().includes('invalid') || 
            error.message.toLowerCase().includes('credentials')) {
          return true;
        }
        // Any other error (like "user not found" or "email not confirmed") means email doesn't exist or isn't active
        return false;
      }
      
      // If no error, email exists (shouldn't happen with dummy password, but just in case)
      return true;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const sendMagicLink = async (email: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/auth/complete-signup`;
    
    const { error } = await supabase.auth.signInWithOtp({
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
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Use the current domain for the redirect URL (works for both preview and deployed environments)
    const redirectUrl = window.location.origin;
    
    const { error } = await supabase.auth.signUp({
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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Clean up existing state
      localStorage.removeItem('supabase.auth.token');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
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

    const { error } = await supabase.auth.signInWithPassword({
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
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { error };
  };

  const resetPassword = async (newPassword: string) => {
    // This is used during password reset flow (no current password needed)
    const { error } = await supabase.auth.updateUser({
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