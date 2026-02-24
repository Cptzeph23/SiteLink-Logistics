import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/return-trips
 * Driver creates a return trip offer after completing a delivery
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      original_job_id,
      pickup_address,
      pickup_location,
      delivery_address,
      delivery_location,
      distance_km,
      original_price,
      discount_percentage = 20, // Default 20% discount
    } = body;

    // Validation
    if (!original_job_id || !pickup_address || !delivery_address || !pickup_location || !delivery_location) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get driver profile
    const { data: driverProfile, error: driverError } = await admin
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (driverError || !driverProfile) {
      return NextResponse.json(
        { error: 'Driver profile not found' },
        { status: 404 }
      );
    }

    // Verify original job belongs to this driver
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, driver_id, status')
      .eq('id', original_job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Original job not found' }, { status: 404 });
    }

    if (job.driver_id !== driverProfile.id) {
      return NextResponse.json(
        { error: 'You are not assigned to this job' },
        { status: 403 }
      );
    }

    if (job.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Job must be delivered to create return trip' },
        { status: 400 }
      );
    }

    // Calculate discounted price
    const discountedPrice = original_price * (1 - discount_percentage / 100);

    // Create return trip
    const { data: returnTrip, error: createError } = await admin
      .from('return_trips')
      .insert({
        original_job_id,
        driver_id: driverProfile.id,
        pickup_address,
        pickup_location: `POINT(${pickup_location.lng} ${pickup_location.lat})`,
        delivery_address,
        delivery_location: `POINT(${delivery_location.lng} ${delivery_location.lat})`,
        distance_km,
        original_price,
        discount_percentage,
        discountedPrice,
        status: 'available',
        expires_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // Expires in 4 hours
      })
      .select()
      .single();

    if (createError) {
      console.error('Return trip creation error:', createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Return trip offer created',
      return_trip: returnTrip,
    });

  } catch (error: any) {
    console.error('Return trip creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create return trip' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/return-trips
 * List available return trips (for clients)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get available return trips
    const { data: returnTrips, error } = await admin
      .from('return_trips')
      .select(`
        *,
        driver_profile:driver_profiles(
          user:users(full_name, phone)
        )
      `)
      .eq('status', 'available')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ return_trips: returnTrips || [] });

  } catch (error: any) {
    console.error('Return trips fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch return trips' },
      { status: 500 }
    );
  }
}