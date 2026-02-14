import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/register
 * Creates auth user via admin API (no trigger conflict since trigger is dropped),
 * then directly inserts into public.users and profile tables.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email, password, full_name, phone, role,
      company_name, business_type,
      license_number, license_expiry, id_number,
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !phone || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, phone and role are required' },
        { status: 400 }
      );
    }
    if (!['client', 'driver'].includes(role)) {
      return NextResponse.json({ error: 'Role must be client or driver' }, { status: 400 });
    }
    if (role === 'driver' && (!license_number || !license_expiry || !id_number)) {
      return NextResponse.json(
        { error: 'License number, expiry date and ID number are required for drivers' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // ── Step 1: Create auth user via admin (bypasses trigger issues) ──
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,       // auto-confirm, no email needed
      user_metadata: { full_name, phone, role },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // ── Step 2: Insert into public.users ──
    const { error: userError } = await admin
      .from('users')
      .insert({ id: userId, email, phone, full_name, role });

    if (userError) {
      console.error('User insert error:', userError);
      // Rollback auth user
      await admin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: `Failed to save user profile: ${userError.message}` },
        { status: 500 }
      );
    }

    // ── Step 3: Insert role-specific profile ──
    if (role === 'client') {
      const { error: profileError } = await admin
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
      const { error: profileError } = await admin
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

    // ── Step 4: Sign in to establish session cookie ──
    const regularClient = await createClient();
    const { error: signInError } = await regularClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Account created fine — just couldn't auto-login, send to login page
      return NextResponse.json({
        success: true,
        message: 'Account created. Please log in.',
        redirect: '/login',
      });
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email, full_name, role },
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