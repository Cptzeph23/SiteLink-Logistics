'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { authService } from '@/lib/services/auth.service';
import {
  Package, Truck, MapPin, Plus, ArrowRight,
  Clock, CheckCircle, AlertCircle, XCircle,
} from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: any }> = {
  pending:    { label: 'Pending',    cls: 'badge-pending',    icon: Clock },
  accepted:   { label: 'Accepted',   cls: 'badge-accepted',   icon: Truck },
  in_transit: { label: 'In Transit', cls: 'badge-in-transit', icon: MapPin },
  delivered:  { label: 'Delivered',  cls: 'badge-delivered',  icon: CheckCircle },
  cancelled:  { label: 'Cancelled',  cls: 'badge-cancelled',  icon: XCircle },
};

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser]   = useState<any>(null);
  const [jobs, setJobs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login'); return;
        }
        setUser(currentUser);
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  if (loading) return <LoadingPage />;

  const activeJobs    = jobs.filter(j => ['accepted','in_transit'].includes(j.status));
  const pendingJobs   = jobs.filter(j => j.status === 'pending');
  const completedJobs = jobs.filter(j => j.status === 'delivered');
  const totalSpent    = completedJobs.reduce((s, j) => s + j.total_amount, 0);
  const recentJobs    = jobs.slice(0, 5);

  return (
    <div className="page-shell">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="page-content">

        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--orange)' }}>
            Client Portal
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Welcome, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.profile?.company_name || 'Manage your material deliveries'}
          </p>
        </div>

        {/* ── Stats Row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children animate-fade-up">
          {[
            { label: 'Total Bookings', value: jobs.length, color: 'var(--orange)', icon: Package },
            { label: 'Active Now',     value: activeJobs.length, color: '#3B82F6', icon: Truck },
            { label: 'Pending',        value: pendingJobs.length, color: '#F59E0B', icon: Clock },
            { label: 'Total Spent',    value: formatKES(totalSpent), color: '#10B981', icon: CheckCircle },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-extrabold text-slate-900"
                    style={{ fontFamily: 'Syne, sans-serif' }}>
                    {s.value}
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${s.color}18` }}>
                  <s.icon className="h-4.5 w-4.5" style={{ color: s.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Active Job Alert ───────────────────────────── */}
        {activeJobs.length > 0 && (
          <Link href="/client/bookings">
            <div className="mb-6 rounded-xl p-4 border-2 flex items-center justify-between
              cursor-pointer hover:shadow-md transition-all animate-fade-in"
              style={{ background: '#EFF6FF', borderColor: '#BFDBFE' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">
                    {activeJobs.length} active delivery{activeJobs.length > 1 ? 's' : ''} in progress
                  </p>
                  <p className="text-blue-600 text-xs">Tap to track live location →</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-blue-400" />
            </div>
          </Link>
        )}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Quick Actions ──────────────────────────── */}
          <div className="space-y-4 animate-slide-in">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Actions</p>

            <Link href="/client/bookings/new">
              <div className="rounded-2xl p-5 text-white cursor-pointer
                hover:-translate-y-1 transition-all flex items-center gap-4"
                style={{
                  background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-dark) 100%)',
                  boxShadow: '0 4px 20px rgba(255,107,53,0.35)',
                }}>
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>New Booking</p>
                  <p className="text-white/70 text-xs mt-0.5">Select materials & get instant quote</p>
                </div>
                <ArrowRight className="h-5 w-5 text-white/60 ml-auto" />
              </div>
            </Link>

            <Link href="/client/bookings">
              <div className="rounded-2xl p-5 bg-white border border-slate-100
                cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#EFF6FF' }}>
                  <Package className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
                    My Bookings
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">{jobs.length} total bookings</p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-300 ml-auto" />
              </div>
            </Link>

            {/* Pricing Info Card */}
            <div className="rounded-2xl p-5 border border-slate-100 bg-white">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Pricing Guide
              </p>
              {[
                { label: 'Base Fee (5km)', value: 'KSh 500' },
                { label: 'Per km after', value: 'KSh 50/km' },
                { label: 'Platform fee', value: '20%' },
                { label: 'Payment',      value: 'M-Pesa' },
              ].map(p => (
                <div key={p.label} className="flex justify-between py-1.5 text-sm border-b border-slate-50 last:border-0">
                  <span className="text-slate-500">{p.label}</span>
                  <span className="font-semibold text-slate-700">{p.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Bookings ────────────────────────── */}
          <div className="lg:col-span-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Recent Bookings
              </p>
              <Link href="/client/bookings"
                className="text-xs font-semibold hover:underline"
                style={{ color: 'var(--orange)' }}>
                View all →
              </Link>
            </div>

            {recentJobs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'var(--orange-light)' }}>
                  <Package className="h-8 w-8" style={{ color: 'var(--orange)' }} />
                </div>
                <h3 className="font-bold text-slate-800 mb-1"
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  No bookings yet
                </h3>
                <p className="text-slate-400 text-sm mb-5">
                  Create your first booking to move materials to your site.
                </p>
                <Link href="/client/bookings/new">
                  <button className="btn-primary text-sm px-5 py-2.5">
                    Create First Booking
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentJobs.map((job: any) => {
                  const sc      = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                  const pickup  = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
                  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
                  const Icon    = sc.icon;
                  return (
                    <Link key={job.id} href={`/client/bookings/${job.id}`}>
                      <div className="job-card cursor-pointer">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">
                                {job.job_number}
                              </span>
                              <span className={sc.cls}>
                                <Icon className="h-3 w-3 inline mr-1" />
                                {sc.label}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              {pickup && (
                                <p className="flex items-center gap-1.5 truncate">
                                  <span className="w-3.5 h-3.5 rounded-full bg-green-500 flex-shrink-0" />
                                  {pickup.address}
                                </p>
                              )}
                              {delivery && (
                                <p className="flex items-center gap-1.5 truncate">
                                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 flex-shrink-0" />
                                  {delivery.address}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg" style={{ color: 'var(--orange)', fontFamily: 'Syne, sans-serif' }}>
                              {formatKES(job.total_amount)}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {new Date(job.created_at).toLocaleDateString('en-KE', {
                                day: 'numeric', month: 'short',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}