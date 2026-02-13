import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/jobs/available
 * Returns all pending jobs available for drivers to accept
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Verify user is a driver
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!userData || userData.role !== 'driver') {
      return NextResponse.json({ error: 'Only drivers can view available jobs' }, { status: 403 });
    }

    // Fetch all pending jobs with full details
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        job_stops(*),
        job_materials(
          *,
          material:materials(name, category, unit_weight_kg)
        ),
        client:client_profiles(
          company_name,
          business_type,
          user:users(full_name, phone)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ jobs: jobs || [] });

  } catch (error) {
    console.error('Error fetching available jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available jobs' },
      { status: 500 }
    );
  }
}