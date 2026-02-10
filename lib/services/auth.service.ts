import { createClient } from '@/lib/supabase/client';
import type { RegisterFormData } from '@/types';

/**
 * Authentication Service
 * Handles all auth-related operations with Supabase
 */

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Sign up new user
   */
  async signUp(formData: RegisterFormData) {
    const supabase = createClient();

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Create user record in database
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: formData.email,
        phone: formData.phone,
        full_name: formData.full_name,
        role: formData.role,
      });

    if (userError) throw userError;

    // 3. Create role-specific profile
    if (formData.role === 'client') {
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: authData.user.id,
          company_name: formData.company_name,
          business_type: formData.business_type,
        });

      if (profileError) throw profileError;
    } else if (formData.role === 'driver') {
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .insert({
          user_id: authData.user.id,
          license_number: formData.license_number!,
          license_expiry: formData.license_expiry!,
          id_number: formData.id_number!,
        });

      if (profileError) throw profileError;
    }

    return authData;
  },

  /**
   * Sign out current user
   */
  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * Get current session
   */
  async getSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * Get current user with profile
   */
  async getCurrentUser() {
    const supabase = createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    // Get user data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError) throw userError;

    // Get role-specific profile
    let profile = null;
    if (userData.role === 'client') {
      const { data } = await supabase
        .from('client_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    } else if (userData.role === 'driver') {
      const { data } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      profile = data;
    }

    return {
      id: user.id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
      profile,
    };
  },
};