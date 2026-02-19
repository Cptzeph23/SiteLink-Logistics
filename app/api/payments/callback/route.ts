import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { mpesaService } from '@/lib/services/mpesa.service';

/**
 * POST /api/payments/callback
 * M-Pesa callback endpoint - called by Safaricom after payment completion
 * 
 * IMPORTANT: This endpoint must be publicly accessible (no auth check)
 * Register this URL in your M-Pesa Daraja portal
 */
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const callbackData = await request.json();

    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Validate callback payload
    const validation = mpesaService.validateCallback(callbackData);

    if (!validation.success) {
      console.log('M-Pesa payment failed or invalid callback');
      
      // Try to find and update payment record
      const checkoutRequestId = callbackData.Body?.stkCallback?.CheckoutRequestID;
      if (checkoutRequestId) {
        await admin
          .from('payments')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
          })
          .eq('transaction_reference', checkoutRequestId);
      }

      return NextResponse.json({ 
        ResultCode: 0, 
        ResultDesc: 'Callback received' 
      });
    }

    // Payment successful - update database
    const {
      mpesaReceiptNumber,
      transactionDate,
      phoneNumber,
      amount,
    } = validation;

    const checkoutRequestId = callbackData.Body.stkCallback.CheckoutRequestID;

    // Find payment record
    const { data: payment, error: findError } = await admin
      .from('payments')
      .select('id, job_id')
      .eq('transaction_reference', checkoutRequestId)
      .single();

    if (findError || !payment) {
      console.error('Payment record not found:', checkoutRequestId);
      return NextResponse.json({ 
        ResultCode: 0, 
        ResultDesc: 'Payment record not found' 
      });
    }

    // Update payment record
    const { error: updateError } = await admin
      .from('payments')
      .update({
        payment_status: 'completed',
        mpesa_receipt_number: mpesaReceiptNumber,
        payment_date: new Date(
          transactionDate ? String(transactionDate) : Date.now()
        ).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    } else {
      console.log(`Payment completed: ${mpesaReceiptNumber} for job ${payment.job_id}`);
      
      // Optionally: Send SMS/email confirmation to client
      // Optionally: Release payment to driver (after platform fee)
    }

    // Always return success to M-Pesa
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Accepted' 
    });

  } catch (error: any) {
    console.error('M-Pesa callback processing error:', error);
    
    // Still return success to M-Pesa to avoid retries
    return NextResponse.json({ 
      ResultCode: 0, 
      ResultDesc: 'Callback processing error logged' 
    });
  }
}

/**
 * GET /api/payments/callback
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'M-Pesa callback endpoint is active' 
  });
}