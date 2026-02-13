import { createClient } from '@/lib/supabase/client';
import type { RegisterFormData } from '@/types';

export const authService = {
  async signIn(email: string, password: string) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(formData: RegisterFormData) {
    const supabase = createClient();

    // Pass ALL fields as metadata so the DB trigger can use them
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name:      formData.full_name,
          phone:          formData.phone,
          role:           formData.role,
          // Driver-specific (trigger uses these)
          license_number: formData.license_number || '',
          license_expiry: formData.license_expiry || '',
          id_number:      formData.id_number || '',
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // Wait briefly for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update client profile with optional business details if provided
    if (formData.role === 'client' && (formData.company_name || formData.business_type)) {
      const supabaseClient = createClient();
      await supabaseClient
        .from('client_profiles')
        .update({
          company_name:  formData.company_name  || null,
          business_type: formData.business_type || null,
        })
        .eq('user_id', authData.user.id);
    }

    return authData;
  },

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentUser() {
    const supabase = createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) throw userError;

    // Fallback to auth metadata if public.users row not yet ready
    if (!userData) {
      const meta = user.user_metadata;
      return {
        id:        user.id,
        email:     user.email || '',
        role:      meta?.role || 'client',
        full_name: meta?.full_name || '',
        profile:   null,
      };
    }

    // Get role-specific profile
    let profile = null;
    if (userData.role === 'client') {
      const { data } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = data;
    } else if (userData.role === 'driver') {
      const { data } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      profile = data;
    }

    return {
      id:        user.id,
      email:     userData.email,
      role:      userData.role,
      full_name: userData.full_name,
      profile,
    };
  },
};