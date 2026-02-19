import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * POST /api/proof-of-delivery
 * Creates a proof of delivery record with photo and recipient details
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const {
      job_id,
      recipient_name,
      recipient_phone,
      notes,
      photo_base64, // Base64 encoded image
    } = body;

    if (!job_id || !recipient_name) {
      return NextResponse.json(
        { error: 'Job ID and recipient name are required' },
        { status: 400 }
      );
    }

    // Verify job exists and user is the assigned driver
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select('id, driver_id, status')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job fetch error:', jobError);
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Debug: Log the comparison
    console.log('PoD Auth Check:', {
      job_driver_id: job.driver_id,
      current_user_id: user.id,
      match: job.driver_id === user.id
    });

    if (job.driver_id !== user.id) {
      console.error('Driver mismatch:', { expected: job.driver_id, actual: user.id });
      return NextResponse.json(
        { error: 'You are not assigned to this job' },
        { status: 403 }
      );
    }

    if (job.status !== 'in_transit') {
      return NextResponse.json(
        { error: 'Job must be in transit to mark as delivered' },
        { status: 400 }
      );
    }

    // Upload photo to Supabase Storage if provided
    let photoUrl = null;
    if (photo_base64) {
      try {
        // Extract base64 data (remove data:image/...;base64, prefix if present)
        const base64Data = photo_base64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        const fileName = `pod-${job_id}-${Date.now()}.jpg`;
        const filePath = `proof-of-delivery/${fileName}`;

        const { data: uploadData, error: uploadError } = await admin.storage
          .from('delivery-photos')
          .upload(filePath, buffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          // Continue without photo rather than failing entire PoD
        } else {
          // Get public URL
          const { data: urlData } = admin.storage
            .from('delivery-photos')
            .getPublicUrl(filePath);
          
          photoUrl = urlData.publicUrl;
        }
      } catch (err) {
        console.error('Photo processing error:', err);
        // Continue without photo
      }
    }

    // Create proof of delivery record
    const { data: pod, error: podError } = await admin
      .from('proof_of_delivery')
      .insert({
        job_id,
        recipient_name,
        recipient_phone: recipient_phone || null,
        notes: notes || null,
        photo_url: photoUrl,
        delivered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (podError) {
      console.error('PoD insert error:', podError);
      return NextResponse.json(
        { error: `Failed to create PoD: ${podError.message}` },
        { status: 500 }
      );
    }

    // Update job status to delivered
    const { error: updateError } = await admin
      .from('jobs')
      .update({
        status: 'delivered',
        actual_delivery_time: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', job_id);

    if (updateError) {
      console.error('Job update error:', updateError);
      return NextResponse.json(
        { error: `Failed to update job status: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Delivery confirmed successfully',
      pod,
    });

  } catch (error: any) {
    console.error('PoD creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create proof of delivery' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proof-of-delivery?job_id=xxx
 * Retrieves proof of delivery for a job
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('job_id');

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Get PoD record
    const { data: pod, error } = await admin
      .from('proof_of_delivery')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ pod: null, message: 'No PoD found for this job' });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pod });

  } catch (error: any) {
    console.error('PoD retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve proof of delivery' },
      { status: 500 }
    );
  }
}