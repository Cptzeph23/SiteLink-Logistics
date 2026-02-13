import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData || userData.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can view available jobs' }, { status: 403 });
    }

    const { data: jobs, error } = await admin
      .from('jobs')
      .select(`
        *,
        job_stops(*),
        job_materials(*, material:materials(name, category, unit_weight_kg)),
        client:client_profiles(company_name, business_type, user:users(full_name, phone))
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs: jobs || [] });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch available jobs' }, { status: 500 });
  }
}