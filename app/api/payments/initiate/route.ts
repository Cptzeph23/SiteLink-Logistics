import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { mpesaService } from '@/lib/services/mpesa.service';

/**
 * POST /api/payments/initiate
 * Initiates M-Pesa STK Push payment for a delivered job
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

    const body = await request.json();
    const { job_id, phone_number } = body;

    if (!job_id || !phone_number) {
      return NextResponse.json(
        { error: 'Job ID and phone number are required' },
        { status: 400 }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await admin
      .from('jobs')
      .select(`
        id,
        job_number,
        client_id,
        status,
        total_amount,
        client:client_profiles(user:users(full_name))
      `)
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Verify user is the client
    if (job.client_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to pay for this job' },
        { status: 403 }
      );
    }

    // Verify job is delivered
    if (job.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Job must be delivered before payment' },
        { status: 400 }
      );
    }

    // Check if already paid
    const { data: existingPayment } = await admin
      .from('payments')
      .select('id, payment_status')
      .eq('job_id', job_id)
      .eq('payment_status', 'completed')
      .single();

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Job has already been paid' },
        { status: 400 }
      );
    }

    // Initiate M-Pesa payment
    const mpesaResponse = await mpesaService.initiatePayment({
      phoneNumber: phone_number,
      amount: job.total_amount,
      accountReference: job.job_number,
      transactionDesc: `SiteLink Job ${job.job_number}`,
    });

    // Create payment record
    const { data: payment, error: paymentError } = await admin
      .from('payments')
      .insert({
        job_id,
        client_id: job.client_id,
        amount: job.total_amount,
        payment_method: 'mpesa',
        payment_status: 'pending',
        mpesa_phone_number: phone_number,
        transaction_reference: mpesaResponse.CheckoutRequestID,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment request sent. Check your phone to complete payment.',
      payment_id: payment.id,
      checkout_request_id: mpesaResponse.CheckoutRequestID,
      customer_message: mpesaResponse.CustomerMessage,
    });

  } catch (error: any) {
    console.error('Payment initiation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}