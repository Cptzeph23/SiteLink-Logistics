import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/jobs
 * Returns jobs for the currently logged-in user
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
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

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let jobs;

    if (userData.role === 'client') {
      // Get client profile
      const { data: clientProfile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!clientProfile) {
        return NextResponse.json({ jobs: [] });
      }

      // Get client's jobs
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_stops(*),
          job_materials(
            *,
            material:materials(name, category)
          )
        `)
        .eq('client_id', clientProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      jobs = data;

    } else if (userData.role === 'driver') {
      // Get driver profile
      const { data: driverProfile } = await supabase
        .from('driver_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!driverProfile) {
        return NextResponse.json({ jobs: [] });
      }

      // Get driver's jobs
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_stops(*),
          job_materials(
            *,
            material:materials(name, category)
          )
        `)
        .eq('driver_id', driverProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      jobs = data;

    } else if (userData.role === 'admin') {
      // Admin gets all jobs
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          *,
          job_stops(*),
          job_materials(
            *,
            material:materials(name, category)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      jobs = data;
    }

    return NextResponse.json({ jobs: jobs || [] });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/jobs
 * Creates a new job
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client profile
    const { data: clientProfile } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!clientProfile) {
      return NextResponse.json({ error: 'Client profile not found' }, { status: 404 });
    }

    const {
      materials,
      stops,
      pricing,
      scheduled_pickup_time,
      special_instructions,
      overweight_acknowledged,
    } = body;

    // Create the job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        client_id: clientProfile.id,
        status: 'pending',
        total_distance_km: pricing.total_distance_km,
        estimated_duration_minutes: pricing.estimated_duration_minutes,
        base_fee: pricing.base_fee,
        distance_fee: pricing.distance_fee,
        handling_fee: pricing.handling_fee,
        subtotal: pricing.subtotal,
        platform_fee: pricing.platform_fee,
        total_amount: pricing.total_amount,
        total_weight_kg: pricing.total_weight_kg,
        is_overweight: pricing.total_weight_kg > 2000,
        overweight_acknowledged: overweight_acknowledged || false,
        requires_straps: pricing.requires_straps,
        requires_tarp: pricing.requires_tarp,
        has_fragile_items: pricing.has_fragile_items,
        special_instructions: special_instructions || null,
        scheduled_pickup_time: scheduled_pickup_time || null,
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Create job stops
    const stopsToInsert = stops.map((stop: any, index: number) => ({
      job_id: job.id,
      stop_order: index + 1,
      stop_type: stop.stop_type,
      address: stop.address,
      location: `POINT(${stop.location.lng} ${stop.location.lat})`,
      contact_name: stop.contact_name || null,
      contact_phone: stop.contact_phone || null,
      is_difficult_access: stop.is_difficult_access || false,
      access_notes: stop.access_notes || null,
    }));

    const { error: stopsError } = await supabase
      .from('job_stops')
      .insert(stopsToInsert);

    if (stopsError) throw stopsError;

    // Fetch material details for insertion
    const materialIds = materials.map((m: any) => m.material_id);
    const { data: materialData } = await supabase
      .from('materials')
      .select('id, unit_weight_kg, handling_fee_per_unit')
      .in('id', materialIds);

    // Create job materials
    const materialsToInsert = materials.map((selected: any) => {
      const material = materialData?.find((m: any) => m.id === selected.material_id);
      const totalWeight = (material?.unit_weight_kg || 0) * selected.quantity;
      const handlingFee = (material?.handling_fee_per_unit || 0) * selected.quantity;

      return {
        job_id: job.id,
        material_id: selected.material_id,
        quantity: selected.quantity,
        unit_weight_kg: material?.unit_weight_kg || 0,
        total_weight_kg: totalWeight,
        handling_fee: handlingFee,
      };
    });

    const { error: materialsError } = await supabase
      .from('job_materials')
      .insert(materialsToInsert);

    if (materialsError) throw materialsError;

    return NextResponse.json({
      job,
      message: 'Job created successfully',
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}