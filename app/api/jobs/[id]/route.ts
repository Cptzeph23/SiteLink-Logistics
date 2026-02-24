import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { notificationService } from '@/lib/services/notification.service';

/**
 * GET /api/jobs/[id]
 * Fetch a specific job with all details
 */
export async function GET(
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

    const { data: job, error } = await admin
      .from('jobs')
      .select(`
        *,
        job_stops (*),
        job_materials (*, material:materials(*)),
        client_profile:client_profiles!jobs_client_id_fkey(
          user:users(full_name, phone)
        ),
        driver_profile:driver_profiles!jobs_driver_id_fkey(
          user:users(full_name, phone)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    console.error('Job fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/jobs/[id]
 * Update job status (accept, start_transit, deliver)
 */
export async function PATCH(
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

    const body = await request.json();
    const { action } = body;

    // Get current job
    const { data: job, error: fetchError } = await admin
      .from('jobs')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    let updateData: any = { updated_at: new Date().toISOString() };
    let message = '';

    switch (action) {
      case 'accept':
        if (job.status !== 'pending') {
          return NextResponse.json(
            { error: 'Job is not available' },
            { status: 400 }
          );
        }
        
        // Get driver profile ID from user ID
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
        
        // CRITICAL FIX: Set driver_id to the driver_profile.id
        updateData.status = 'accepted';
        updateData.driver_id = driverProfile.id;
        message = 'Job accepted successfully';
        break;

      case 'start_transit':
        if (job.status !== 'accepted') {
          return NextResponse.json(
            { error: 'Job must be accepted first' },
            { status: 400 }
          );
        }
        
        // Get driver profile ID
        const { data: driverProfileStart, error: driverErrorStart } = await admin
          .from('driver_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (driverErrorStart || !driverProfileStart) {
          return NextResponse.json(
            { error: 'Driver profile not found' },
            { status: 404 }
          );
        }
        
        if (job.driver_id !== driverProfileStart.id) {
          return NextResponse.json(
            { error: 'You are not assigned to this job' },
            { status: 403 }
          );
        }
        
        updateData.status = 'in_transit';
        updateData.actual_pickup_time = new Date().toISOString();
        message = 'Trip started';
        break;

      case 'deliver':
        if (job.status !== 'in_transit') {
          return NextResponse.json(
            { error: 'Job must be in transit' },
            { status: 400 }
          );
        }
        
        // Get driver profile ID
        const { data: driverProfileDeliver, error: driverErrorDeliver } = await admin
          .from('driver_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (driverErrorDeliver || !driverProfileDeliver) {
          return NextResponse.json(
            { error: 'Driver profile not found' },
            { status: 404 }
          );
        }
        
        if (job.driver_id !== driverProfileDeliver.id) {
          return NextResponse.json(
            { error: 'You are not assigned to this job' },
            { status: 403 }
          );
        }
        
        updateData.status = 'delivered';
        updateData.actual_delivery_time = new Date().toISOString();
        message = 'Job marked as delivered';
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update job
    const { data: updatedJob, error: updateError } = await admin
      .from('jobs')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        client_profile:client_profiles!jobs_client_id_fkey(
          user:users(full_name, phone, email)
        ),
        driver_profile:driver_profiles!jobs_driver_id_fkey(
          user:users(full_name, phone)
        )
      `)
      .single();

    if (updateError) {
      console.error('Job update error:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Send notifications based on action
    try {
      const clientProfile = updatedJob.client_profile as any;
      const driverProfile = updatedJob.driver_profile as any;
      const clientUser = clientProfile?.user as any;
      const driverUser = driverProfile?.user as any;
      
      if (action === 'accept' && clientUser?.phone && clientUser?.email) {
        await notificationService.notifyJobAccepted({
          clientPhone: clientUser.phone,
          clientEmail: clientUser.email,
          jobNumber: updatedJob.job_number,
          driverName: driverUser?.full_name || 'Driver',
        });
      } else if (action === 'start_transit' && clientUser?.phone && clientUser?.email) {
        await notificationService.notifyTripStarted({
          clientPhone: clientUser.phone,
          clientEmail: clientUser.email,
          jobNumber: updatedJob.job_number,
        });
      }
    } catch (notifError) {
      console.error('Notification error:', notifError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message,
      job: updatedJob,
    });

  } catch (error: any) {
    console.error('Job update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update job' },
      { status: 500 }
    );
  }
}