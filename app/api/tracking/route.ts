import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tracking
 * Driver sends GPS location updates
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job_id, latitude, longitude, speed_kmh, heading, accuracy_meters } = body;

    if (!job_id || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'job_id, latitude, and longitude are required' },
        { status: 400 }
      );
    }

    // Verify the driver owns this job
    const { data: driverProfile } = await supabase
      .from('driver_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!driverProfile) {
      return NextResponse.json({ error: 'Driver profile not found' }, { status: 404 });
    }

    const { data: job } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('id', job_id)
      .eq('driver_id', driverProfile.id)
      .maybeSingle();

    if (!job) {
      return NextResponse.json({ error: 'Job not found or not assigned to you' }, { status: 404 });
    }

    if (job.status !== 'in_transit') {
      return NextResponse.json({ error: 'Job must be in transit to track' }, { status: 400 });
    }

    // Insert tracking point
    const { data: trackingPoint, error: trackingError } = await supabase
      .from('tracking')
      .insert({
        job_id,
        driver_id: driverProfile.id,
        location: `POINT(${longitude} ${latitude})`,
        speed_kmh: speed_kmh || 0,
        heading: heading || 0,
        accuracy_meters: accuracy_meters || 0,
      })
      .select()
      .single();

    if (trackingError) throw trackingError;

    // Also update driver's current location
    await supabase
      .from('driver_profiles')
      .update({
        current_location: `POINT(${longitude} ${latitude})`,
        last_location_update: new Date().toISOString(),
      })
      .eq('id', driverProfile.id);

    return NextResponse.json({ tracking: trackingPoint });

  } catch (error: any) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save tracking point' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking?job_id=xxx
 * Get tracking history for a job
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'job_id is required' }, { status: 400 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last 100 tracking points for this job
    const { data: points, error } = await supabase
      .from('tracking')
      .select('id, location, speed_kmh, heading, accuracy_meters, recorded_at')
      .eq('job_id', jobId)
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Parse PostGIS location to lat/lng
    const parsedPoints = (points || []).map((point: any) => {
      // Location comes as "POINT(lng lat)" - parse it
      const match = point.location?.match(/POINT\(([^ ]+) ([^)]+)\)/);
      return {
        ...point,
        latitude: match ? parseFloat(match[2]) : null,
        longitude: match ? parseFloat(match[1]) : null,
      };
    });

    return NextResponse.json({ points: parsedPoints });

  } catch (error: any) {
    console.error('Error fetching tracking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tracking data' },
      { status: 500 }
    );
  }
}