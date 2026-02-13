import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/jobs/[id]
 * Get a single job with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        job_stops(*),
        job_materials(
          *,
          material:materials(name, category, unit_weight_kg, requires_straps, requires_tarp, is_fragile)
        ),
        client:client_profiles(
          company_name,
          business_type,
          user:users(full_name, phone)
        ),
        driver:driver_profiles(
          user:users(full_name, phone)
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });

  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update job status (accept, start transit, deliver, cancel)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const { action } = body;

    // Handle different actions
    if (action === 'accept') {
      // Driver accepting a job
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!driverProfile) {
        return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
      }

      const { data: job, error } = await supabase
        .from('jobs')
        .update({
          status: 'accepted',
          driver_id: driverProfile.id,
        })
        .eq('id', id)
        .eq('status', 'pending') // Can only accept pending jobs
        .select()
        .single();

      if (error) throw error;
      if (!job) {
        return NextResponse.json(
          { error: 'Job no longer available' },
          { status: 409 }
        );
      }

      return NextResponse.json({ job, message: 'Job accepted successfully!' });

    } else if (action === 'start_transit') {
      const { data: job, error } = await supabase
        .from('jobs')
        .update({
          status: 'in_transit',
          actual_pickup_time: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'accepted')
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ job, message: 'Trip started!' });

    } else if (action === 'deliver') {
      const { data: job, error } = await supabase
        .from('jobs')
        .update({
          status: 'delivered',
          actual_delivery_time: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('status', 'in_transit')
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ job, message: 'Job marked as delivered!' });

    } else if (action === 'cancel') {
      const { data: job, error } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ job, message: 'Job cancelled.' });

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    console.error('Error updating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}