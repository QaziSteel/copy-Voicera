import { useState, useEffect } from 'react';
import { createDynamicSupabaseClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useProject } from '@/contexts/ProjectContext';

export interface PhoneNumberRecord {
  id: string;
  phone_number: string;
  project_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UsePhoneNumbersResult {
  phoneNumbers: PhoneNumberRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createPhoneNumber: (phoneNumber: string, externalId?: string) => Promise<PhoneNumberRecord | null>;
  updatePhoneNumber: (id: string, updates: Partial<PhoneNumberRecord>) => Promise<void>;
  deletePhoneNumber: (id: string) => Promise<void>;
}

export const usePhoneNumbers = (): UsePhoneNumbersResult => {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { currentProject } = useProject();

  const fetchPhoneNumbers = async () => {
    if (!user || !currentProject) {
      setPhoneNumbers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const supabase = createDynamicSupabaseClient();

      const { data, error: phoneNumbersError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (phoneNumbersError) {
        throw phoneNumbersError;
      }

      setPhoneNumbers(data || []);
    } catch (err) {
      console.error('Error fetching phone numbers:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const createPhoneNumber = async (phoneNumber: string, externalId?: string): Promise<PhoneNumberRecord | null> => {
    if (!user || !currentProject) {
      throw new Error('User not authenticated or no current project');
    }

    try {
      const supabase = createDynamicSupabaseClient();
      
      const phoneNumberData = {
        phone_number: phoneNumber,
        project_id: currentProject.id,
        is_active: true,
        ...(externalId && { id: externalId }) // Use external ID if provided
      };

      const { data, error: createError } = await supabase
        .from('phone_numbers')
        .upsert(phoneNumberData, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      await fetchPhoneNumbers(); // Refetch to update list
      return data;
    } catch (err) {
      console.error('Error creating phone number:', err);
      setError(err instanceof Error ? err.message : 'Failed to create phone number');
      return null;
    }
  };

  const updatePhoneNumber = async (id: string, updates: Partial<PhoneNumberRecord>): Promise<void> => {
    try {
      const supabase = createDynamicSupabaseClient();
      const { error: updateError } = await supabase
        .from('phone_numbers')
        .update(updates)
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      await fetchPhoneNumbers(); // Refetch to update list
    } catch (err) {
      console.error('Error updating phone number:', err);
      setError(err instanceof Error ? err.message : 'Failed to update phone number');
    }
  };

  const deletePhoneNumber = async (id: string): Promise<void> => {
    try {
      const supabase = createDynamicSupabaseClient();
      const { error: deleteError } = await supabase
        .from('phone_numbers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      await fetchPhoneNumbers(); // Refetch to update list
    } catch (err) {
      console.error('Error deleting phone number:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete phone number');
    }
  };

  useEffect(() => {
    fetchPhoneNumbers();
  }, [user, currentProject]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !currentProject) return;

    const supabase = createDynamicSupabaseClient();
    const channel = supabase
      .channel('phone-numbers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phone_numbers',
          filter: `project_id=eq.${currentProject.id}`
        },
        (payload) => {
          console.log('Phone numbers changed:', payload);
          fetchPhoneNumbers(); // Refetch data when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, currentProject]);

  return {
    phoneNumbers,
    loading,
    error,
    refetch: fetchPhoneNumbers,
    createPhoneNumber,
    updatePhoneNumber,
    deletePhoneNumber
  };
};