import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/return-trips/[id]/accept
 * Client accepts a return trip offer and converts it to a regular job
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client profile
    const { data: clientProfile, error: clientError } = await admin
      .from('client_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (clientError || !clientProfile) {
      return NextResponse.json(
        { error: 'Client profile not found' },
        { status: 404 }
      );
    }

    // Get return trip
    const { data: returnTrip, error: tripError } = await admin
      .from('return_trips')
      .select('*')
      .eq('id', params.id)
      .single();

    if (tripError || !returnTrip) {
      return NextResponse.json({ error: 'Return trip not found' }, { status: 404 });
    }

    if (returnTrip.status !== 'available') {
      return NextResponse.json(
        { error: 'Return trip is no longer available' },
        { status: 400 }
      );
    }

    if (new Date(returnTrip.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Return trip has expired' },
        { status: 400 }
      );
    }

    // Generate job number
    const jobNumber = `SL-RT-${Date.now().toString().slice(-8)}`;

    // Create a new job from the return trip
    const { data: newJob, error: jobError } = await admin
      .from('jobs')
      .insert({
        job_number: jobNumber,
        client_id: clientProfile.id,
        driver_id: returnTrip.driver_id,
        status: 'accepted', // Pre-accepted since driver offered it
        total_distance_km: returnTrip.distance_km,
        base_fee: 0,
        distance_fee: returnTrip.discounted_price,
        handling_fee: 0,
        subtotal: returnTrip.discounted_price,
        platform_fee: returnTrip.discounted_price * 0.2,
        total_amount: returnTrip.discounted_price * 1.2,
        total_weight_kg: 0, // Unknown for return trips
        is_overweight: false,
        overweight_acknowledged: false,
        requires_straps: false,
        requires_tarp: false,
        has_fragile_items: false,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return NextResponse.json(
        { error: 'Failed to create job' },
        { status: 500 }
      );
    }

    // Create job stops
    const stops = [
      {
        job_id: newJob.id,
        stop_order: 1,
        stop_type: 'pickup',
        address: returnTrip.pickup_address,
        location: returnTrip.pickup_location,
        is_difficult_access: false,
      },
      {
        job_id: newJob.id,
        stop_order: 2,
        stop_type: 'delivery',
        address: returnTrip.delivery_address,
        location: returnTrip.delivery_location,
        is_difficult_access: false,
      },
    ];

    const { error: stopsError } = await admin
      .from('job_stops')
      .insert(stops);

    if (stopsError) {
      console.error('Job stops creation error:', stopsError);
      // Don't fail - the job is created
    }

    // Mark return trip as accepted
    const { error: updateError } = await admin
      .from('return_trips')
      .update({
        status: 'accepted',
        accepted_by_client_id: clientProfile.id,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Return trip update error:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: 'Return trip accepted and job created',
      job: newJob,
    });

  } catch (error: any) {
    console.error('Return trip acceptance error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept return trip' },
      { status: 500 }
    );
  }
}