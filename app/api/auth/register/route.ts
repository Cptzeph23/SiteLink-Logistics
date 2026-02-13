import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/register
 * Handles full user registration server-side using admin client
 * This bypasses RLS entirely, ensuring all records are created reliably
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      phone,
      role,
      company_name,
      business_type,
      license_number,
      license_expiry,
      id_number,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !phone || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, phone, and role are required' },
        { status: 400 }
      );
    }

    if (!['client', 'driver'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be client or driver' },
        { status: 400 }
      );
    }

    if (role === 'driver' && (!license_number || !license_expiry || !id_number)) {
      return NextResponse.json(
        { error: 'License number, expiry date, and ID number are required for drivers' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient();

    // Step 1: Create auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: { full_name, phone, role },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    // Step 2: Insert into public.users
    const { error: userError } = await adminClient
      .from('users')
      .insert({
        id: userId,
        email,
        phone,
        full_name,
        role,
      });

    if (userError) {
      console.error('User insert error:', userError);
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to save user: ${userError.message}` },
        { status: 500 }
      );
    }

    // Step 3: Create role-specific profile
    if (role === 'client') {
      const { error: profileError } = await adminClient
        .from('client_profiles')
        .insert({
          user_id: userId,
          company_name: company_name || null,
          business_type: business_type || null,
        });

      if (profileError) {
        console.error('Client profile error:', profileError);
        return NextResponse.json(
          { error: `Failed to create client profile: ${profileError.message}` },
          { status: 500 }
        );
      }
    } else if (role === 'driver') {
      const { error: profileError } = await adminClient
        .from('driver_profiles')
        .insert({
          user_id: userId,
          license_number,
          license_expiry,
          id_number,
        });

      if (profileError) {
        console.error('Driver profile error:', profileError);
        return NextResponse.json(
          { error: `Failed to create driver profile: ${profileError.message}` },
          { status: 500 }
        );
      }
    }

    // Step 4: Sign in the user to get a session
    const regularClient = await createClient();
    const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in after register error:', signInError);
      // User was created successfully, just couldn't auto-login
      return NextResponse.json({
        success: true,
        message: 'Account created. Please log in.',
        redirect: '/login',
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        role,
      },
      redirect: role === 'client' ? '/client/dashboard' : '/driver/dashboard',
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}