import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/register
 * Uses signUp (not admin.createUser) to avoid trigger conflicts,
 * then uses admin client to ensure all DB records are created.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, phone, role,
            company_name, business_type,
            license_number, license_expiry, id_number } = body;

    if (!email || !password || !full_name || !phone || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    if (!['client', 'driver'].includes(role)) {
      return NextResponse.json({ error: 'Role must be client or driver' }, { status: 400 });
    }
    if (role === 'driver' && (!license_number || !license_expiry || !id_number)) {
      return NextResponse.json({ error: 'License number, expiry, and ID number are required for drivers' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Step 1: Use regular signUp (not admin.createUser) to avoid trigger issues
    // We disable the trigger conflict by using the regular auth flow
    const regularClient = await createClient();
    const { data: authData, error: authError } = await regularClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, phone, role },
      },
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create auth user' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Step 2: Wait for trigger to fire (or handle manually if trigger failed)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Upsert into public.users using admin (in case trigger didn't fire)
    const { error: userError } = await admin
      .from('users')
      .upsert({
        id: userId,
        email,
        phone,
        full_name,
        role,
      }, { onConflict: 'id' });

    if (userError) {
      console.error('User upsert error:', userError);
      return NextResponse.json({ error: `Failed to save user: ${userError.message}` }, { status: 500 });
    }

    // Step 4: Upsert role-specific profile
    if (role === 'client') {
      const { error: profileError } = await admin
        .from('client_profiles')
        .upsert({
          user_id: userId,
          company_name: company_name || null,
          business_type: business_type || null,
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Client profile error:', profileError);
        return NextResponse.json({ error: `Failed to create client profile: ${profileError.message}` }, { status: 500 });
      }
    } else if (role === 'driver') {
      const { error: profileError } = await admin
        .from('driver_profiles')
        .upsert({
          user_id: userId,
          license_number,
          license_expiry,
          id_number,
        }, { onConflict: 'user_id' });

      if (profileError) {
        console.error('Driver profile error:', profileError);
        return NextResponse.json({ error: `Failed to create driver profile: ${profileError.message}` }, { status: 500 });
      }
    }

    // Step 5: Auto-confirm email using admin
    await admin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    // Step 6: Sign in to get session cookie
    const { data: signInData, error: signInError } = await regularClient.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Account created but auto-login failed — send to login page
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please log in.',
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
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}