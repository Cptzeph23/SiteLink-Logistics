'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, TrendingUp, Clock, CheckCircle,
  ArrowRight, MapPin, Smartphone, Loader2
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pending: { label: 'Awaiting Driver', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  accepted: { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_transit: { label: 'On The Way', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-300' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-300' },
};

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, any>>({});
  const [checkingPayments, setCheckingPayments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Fetch jobs
        const res = await fetch('/api/jobs');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const clientJobs = data.jobs || [];
        setJobs(clientJobs);

        // Calculate stats
        const delivered = clientJobs.filter((j: any) => j.status === 'delivered').length;
        const active = clientJobs.filter((j: any) => 
          ['accepted', 'in_transit'].includes(j.status)
        ).length;
        const totalSpent = clientJobs
          .filter((j: any) => j.status === 'delivered')
          .reduce((sum: number, j: any) => sum + (j.total_amount || 0), 0);

        setStats({
          total: clientJobs.length,
          active,
          delivered,
          totalSpent,
        });

        // Check payment status for delivered jobs
        const deliveredJobs = clientJobs.filter((j: any) => j.status === 'delivered');
        for (const job of deliveredJobs) {
          checkPaymentStatus(job.id);
        }

      } catch (err: any) {
        alert(err.message || 'Failed to load dashboard');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function checkPaymentStatus(jobId: string) {
    setCheckingPayments(prev => ({ ...prev, [jobId]: true }));
    try {
      const res = await fetch(`/api/payments/status?job_id=${jobId}`);
      const data = await res.json();
      setPaymentStatuses(prev => ({ ...prev, [jobId]: data }));
    } catch (err) {
      console.error('Payment status check failed:', err);
    } finally {
      setCheckingPayments(prev => ({ ...prev, [jobId]: false }));
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="page-shell">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => {
          await authService.signOut();
          router.push('/');
        }}
      />

      <div className="page-content">
        {/* Header */}
        <div className="mb-8 animate-fade-up">
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight mb-2"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Your Bookings
          </h1>
          <p className="text-slate-500">Track and manage your material deliveries</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-fade-up"
          style={{ animationDelay: '0.1s' }}>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Package className="h-5 w-5 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {stats.total}
            </p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Jobs</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {stats.active}
            </p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Active</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mb-1"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {stats.delivered}
            </p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Delivered</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="h-5 w-5" style={{ color: 'var(--orange)' }} />
            </div>
            <p className="text-2xl font-extrabold mb-1"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)' }}>
              {formatKES(stats.totalSpent)}
            </p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Spent</p>
          </div>
        </div>

        {/* New Booking Button */}
        <div className="mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <Link href="/client/bookings/new">
            <Button 
              className="h-12 px-6 font-semibold rounded-xl transition-all hover:-translate-y-0.5"
              style={{ 
                background: 'var(--orange)', 
                color: 'white',
                boxShadow: '0 4px 16px rgba(255,107,53,0.35)'
              }}>
              + New Booking
            </Button>
          </Link>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {jobs.length === 0 ? (
            <Card className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">No bookings yet</p>
                <Link href="/client/bookings/new">
                  <Button>Create Your First Booking</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job, idx) => {
              const statusStyle = STATUS_STYLES[job.status] || STATUS_STYLES.pending;
              const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
              const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
              const paymentStatus = paymentStatuses[job.id];
              const isDelivered = job.status === 'delivered';
              const isPaid = paymentStatus?.is_paid;
              const isPending = paymentStatus?.is_pending;

              return (
                <div
                  key={job.id}
                  className="job-card animate-fade-up"
                  style={{ animationDelay: `${0.3 + idx * 0.05}s` }}>
                  
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-slate-900 mb-1">{job.job_number}</h3>
                      <p className="text-xs text-slate-400">{formatDate(job.created_at)}</p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusStyle.color}`}>
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">Pickup</p>
                        <p className="text-sm text-slate-700 font-medium truncate">
                          {pickup?.address || 'Not specified'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">Delivery</p>
                        <p className="text-sm text-slate-700 font-medium truncate">
                          {delivery?.address || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Alert for Delivered Jobs */}
                  {isDelivered && !isPaid && !checkingPayments[job.id] && (
                    <Link href={`/client/bookings/${job.id}/payment`}>
                      <div className="mb-4 p-3 rounded-xl flex items-center justify-between cursor-pointer
                        transition-all hover:shadow-md animate-pulse-orange"
                        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #E55A26 100%)', color: 'white' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                            <Smartphone className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">Payment Required</p>
                            <p className="text-white/80 text-xs">
                              Pay {formatKES(job.total_amount)} via M-Pesa
                            </p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </Link>
                  )}

                  {/* Payment Completed Badge */}
                  {isPaid && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-400 rounded-xl flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-900 text-sm">Payment Completed</p>
                        <p className="text-green-600 text-xs">
                          Receipt: {paymentStatus.payment.mpesa_receipt_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                      <p className="text-lg font-extrabold"
                        style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)' }}>
                        {formatKES(job.total_amount)}
                      </p>
                    </div>
                    <Link href={`/client/bookings/${job.id}`}>
                      <Button variant="outline" size="sm" className="rounded-xl">
                        View Details <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}