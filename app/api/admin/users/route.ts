import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/users
 * Returns all users with their profiles
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await admin
      .from('users').select('role').eq('id', user.id).maybeSingle();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { data: users, error } = await admin
      .from('users')
      .select(`
        *,
        client_profile:client_profiles(id, company_name, business_type),
        driver_profile:driver_profiles(id, license_number, license_expiry, is_verified)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ users: users || [] });

  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/users
 * Update user status (activate/deactivate) or verify driver
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await admin
      .from('users').select('role').eq('id', user.id).maybeSingle();

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { user_id, action } = body;

    if (action === 'toggle_active') {
      const { data: target } = await admin
        .from('users').select('is_active').eq('id', user_id).maybeSingle();

      const { data: updated, error } = await admin
        .from('users')
        .update({ is_active: !target?.is_active })
        .eq('id', user_id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ user: updated, message: `User ${updated.is_active ? 'activated' : 'deactivated'}` });

    } else if (action === 'verify_driver') {
      const { data: driverProfile } = await admin
        .from('driver_profiles').select('id').eq('user_id', user_id).maybeSingle();

      if (!driverProfile) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }

      const { error } = await admin
        .from('driver_profiles')
        .update({ is_verified: true })
        .eq('user_id', user_id);

      if (error) throw error;
      return NextResponse.json({ message: 'Driver verified successfully' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}