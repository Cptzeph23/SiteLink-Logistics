import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/payments/status?job_id=xxx
 * Check payment status for a job
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

    // Get payment records for this job
    const { data: payments, error } = await admin
      .from('payments')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if any payment is completed
    const completedPayment = payments?.find(p => p.payment_status === 'completed');
    const pendingPayment = payments?.find(p => p.payment_status === 'pending');
    const latestPayment = payments?.[0];

    return NextResponse.json({
      has_payment: payments && payments.length > 0,
      is_paid: !!completedPayment,
      is_pending: !!pendingPayment,
      payment: completedPayment || pendingPayment || latestPayment || null,
      all_payments: payments || [],
    });

  } catch (error: any) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check payment status' },
      { status: 500 }
    );
  }
}