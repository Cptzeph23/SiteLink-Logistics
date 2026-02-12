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
   * The trigger handle_new_user() automatically creates the public.users record
   * We just need to handle the role-specific profile after
   */
  async signUp(formData: RegisterFormData) {
    const supabase = createClient();

    // 1. Create auth user with metadata
    // The trigger will auto-create the public.users record using this metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
        },
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Failed to create user');

    // 2. Wait briefly for trigger to fire and create the user record
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Create role-specific profile
    if (formData.role === 'client') {
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: authData.user.id,
          company_name: formData.company_name || null,
          business_type: formData.business_type || null,
        });

      if (profileError) {
        console.error('Client profile error:', profileError);
        // Don't throw - user was created, profile can be set later
      }
    } else if (formData.role === 'driver') {
      const { error: profileError } = await supabase
        .from('driver_profiles')
        .insert({
          user_id: authData.user.id,
          license_number: formData.license_number!,
          license_expiry: formData.license_expiry!,
          id_number: formData.id_number!,
        });

      if (profileError) {
        console.error('Driver profile error:', profileError);
        // Don't throw - user was created, profile can be set later
      }
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

    // Get authenticated user from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) return null;

    // Get user data from public.users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userError) throw userError;

    // If no user record yet (trigger might not have fired), 
    // return basic info from auth metadata
    if (!userData) {
      const meta = user.user_metadata;
      return {
        id: user.id,
        email: user.email || '',
        role: meta?.role || 'client',
        full_name: meta?.full_name || '',
        profile: null,
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
      id: user.id,
      email: userData.email,
      role: userData.role,
      full_name: userData.full_name,
      profile,
    };
  },
};