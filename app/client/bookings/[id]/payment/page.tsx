'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Smartphone, Loader2, CheckCircle, 
  AlertCircle, RefreshCw 
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState<any>(null);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        setPhoneNumber(currentUser.profile?.phone || '');

        // Fetch job
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.job.status !== 'delivered') {
          alert('Job must be delivered before payment');
          router.push(`/client/bookings/${jobId}`);
          return;
        }

        setJob(data.job);

        // Check existing payment status
        await checkPaymentStatus();

      } catch (err: any) {
        alert(err.message || 'Failed to load job');
        router.push('/client/bookings');
      } finally {
        setLoading(false);
      }
    }
    init();

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [jobId]);

  async function checkPaymentStatus() {
    setCheckingStatus(true);
    try {
      const res = await fetch(`/api/payments/status?job_id=${jobId}`);
      const data = await res.json();
      setPaymentStatus(data);

      if (data.is_paid) {
        // Payment completed - redirect after 2s
        setTimeout(() => {
          router.push(`/client/bookings/${jobId}`);
        }, 2000);
      }
    } catch (err) {
      console.error('Status check failed:', err);
    } finally {
      setCheckingStatus(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      alert('Phone number is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          phone_number: phoneNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Start polling for payment status
      const interval = setInterval(checkPaymentStatus, 3000);
      setStatusCheckInterval(interval);

    } catch (err: any) {
      alert(err.message || 'Failed to initiate payment');
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const isPaid = paymentStatus?.is_paid;
  const isPending = paymentStatus?.is_pending;

  return (
    <div className="page-shell">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="page-content max-w-xl">

        {/* Header */}
        <Link href={`/client/bookings/${jobId}`}>
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Booking
          </Button>
        </Link>

        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--orange)' }}>
            Payment
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Pay via M-Pesa
          </h1>
          <p className="text-slate-500 text-sm mt-1">{job.job_number}</p>
        </div>

        {/* Payment Completed */}
        {isPaid && (
          <div className="p-6 bg-green-50 border-2 border-green-400 rounded-2xl text-center mb-6 animate-fade-in">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-green-700 text-sm mb-4">
              Receipt: {paymentStatus.payment.mpesa_receipt_number}
            </p>
            <p className="text-green-600 text-xs">
              Redirecting to booking details...
            </p>
          </div>
        )}

        {/* Payment Pending */}
        {!isPaid && isPending && (
          <div className="p-6 bg-blue-50 border-2 border-blue-400 rounded-2xl mb-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
              <div>
                <h2 className="font-bold text-blue-900">Waiting for Payment</h2>
                <p className="text-blue-600 text-sm">Check your phone to complete payment</p>
              </div>
            </div>
            <Button
              onClick={checkPaymentStatus}
              disabled={checkingStatus}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {checkingStatus ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
              ) : (
                <><RefreshCw className="h-4 w-4 mr-2" /> Refresh Status</>
              )}
            </Button>
          </div>
        )}

        {/* Amount Card */}
        {!isPaid && (
          <div className="p-6 bg-white border border-slate-200 rounded-2xl mb-6 animate-fade-up"
            style={{ animationDelay: '0.1s' }}>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
              Amount to Pay
            </p>
            <p className="text-4xl font-extrabold mb-4"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)' }}>
              {formatKES(job.total_amount)}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Smartphone className="h-4 w-4" />
              <span>Payment via M-Pesa STK Push</span>
            </div>
          </div>
        )}

        {/* Payment Form */}
        {!isPaid && !isPending && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up"
            style={{ animationDelay: '0.2s' }}>

            <div>
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 mb-2 block">
                M-Pesa Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                required
                disabled={submitting}
                className="h-12 rounded-xl border-slate-200 bg-white text-lg"
              />
              <p className="text-xs text-slate-400 mt-2">
                Enter the phone number registered to your M-Pesa account
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <p className="font-semibold mb-1">📱 How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Click "Pay Now" below</li>
                <li>You'll receive an M-Pesa prompt on your phone</li>
                <li>Enter your M-Pesa PIN to complete payment</li>
                <li>Payment confirmation will appear here automatically</li>
              </ol>
            </div>

            <Button
              type="submit"
              disabled={submitting || !phoneNumber.trim()}
              className="w-full h-12 text-base font-semibold rounded-xl transition-all hover:-translate-y-0.5"
              style={{
                background: submitting || !phoneNumber.trim() ? '#CBD5E0' : '#10B981',
                color: 'white',
                boxShadow: submitting || !phoneNumber.trim() ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending Payment Request...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Pay {formatKES(job.total_amount)}
                </>
              )}
            </Button>

            <p className="text-center text-xs text-slate-400">
              Secure payment processed by Safaricom M-Pesa
            </p>
          </form>
        )}
      </div>
    </div>
  );
}