import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = "https://nhhdxwgrmcdsapbuvelx.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oaGR4d2dybWNkc2FwYnV2ZWx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4NjAwNDIsImV4cCI6MjA3MTQzNjA0Mn0.GYfN5gGPUth2oo3GTvch9vOZa6lI-Ll93E9-x6M0-iM";

// Get the appropriate storage based on remember me preference
const getStorage = (): Storage => {
  // Check if user has an active "remember me" preference
  const rememberMe = localStorage.getItem('auth_remember_me');
  return rememberMe === 'true' ? localStorage : sessionStorage;
};

// Create client with dynamic storage
export const createDynamicSupabaseClient = (): SupabaseClient<Database> => {
  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: getStorage(),
      persistSession: true,
      autoRefreshToken: true,
    }
  });
};
