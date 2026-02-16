'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { JobCard } from '@/components/driver/JobCard';
import {
  Truck, CheckCircle, Clock, RefreshCw,
  Loader2, TrendingUp, MapPin, Package,
  ChevronRight, ArrowRight,
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

const JOB_STATUS: Record<string, { label: string; cls: string; leftColor: string }> = {
  accepted:   { label: 'Accepted',   cls: 'badge-accepted',   leftColor: '#3B82F6' },
  in_transit: { label: 'In Transit', cls: 'badge-in-transit', leftColor: '#7C3AED' },
  delivered:  { label: 'Delivered',  cls: 'badge-delivered',  leftColor: '#10B981' },
  cancelled:  { label: 'Cancelled',  cls: 'badge-cancelled',  leftColor: '#EF4444' },
};

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser]                 = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs]             = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [activeTab, setActiveTab]       = useState<'available' | 'myjobs'>('available');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [availableRes, myJobsRes] = await Promise.all([
        fetch('/api/jobs/available'),
        fetch('/api/jobs'),
      ]);
      const availableData = await availableRes.json();
      const myJobsData    = await myJobsRes.json();
      setAvailableJobs(availableData.jobs || []);
      setMyJobs(myJobsData.jobs || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'driver') {
          router.push('/login'); return;
        }
        setUser(currentUser);
        await loadData();
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleAcceptJob(jobId: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage('Job accepted! Check "My Jobs" tab.');
      setTimeout(() => setSuccessMessage(''), 4000);
      await loadData();
      setActiveTab('myjobs');
    } catch (err: any) {
      alert(err.message || 'Failed to accept job');
    }
  }

  async function handleUpdateStatus(jobId: string, action: string) {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccessMessage(data.message);
      setTimeout(() => setSuccessMessage(''), 4000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update job');
    }
  }

  const completedJobs  = myJobs.filter(j => j.status === 'delivered').length;
  const activeJobs     = myJobs.filter(j => ['accepted', 'in_transit'].includes(j.status));
  const totalEarnings  = myJobs
    .filter(j => j.status === 'delivered')
    .reduce((sum, j) => sum + (j.total_amount * 0.7), 0);

  if (loading) return <LoadingPage />;

  return (
    <div className="page-shell">
      <Navbar
        userRole="driver"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="page-content">

        {/* ── Header ─────────────────────────────────── */}
        <div className="flex items-start justify-between mb-8 animate-fade-up">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: 'var(--orange)' }}>Driver Portal</p>
            <h1 className="text-3xl font-extrabold text-slate-900"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Hey, {user?.full_name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeJobs.length > 0
                ? `You have ${activeJobs.length} active job${activeJobs.length > 1 ? 's' : ''}`
                : 'Ready for your next job'}
            </p>
          </div>
          <button onClick={() => loadData(true)} disabled={refreshing}
            className="flex items-center gap-2 text-sm font-medium text-slate-500
              px-4 py-2.5 rounded-xl border bg-white hover:bg-slate-50 transition-colors">
            {refreshing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* ── Success Banner ──────────────────────────── */}
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200
            text-green-800 px-4 py-3 rounded-xl text-sm font-medium animate-fade-in">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {/* ── Stats ──────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4 mb-6 stagger-children animate-fade-up">
          {[
            { label: 'Available', value: availableJobs.length, icon: Truck,       color: 'var(--orange)' },
            { label: 'Completed', value: completedJobs,        icon: CheckCircle, color: '#10B981' },
            { label: 'Earned',    value: formatKES(totalEarnings), icon: TrendingUp, color: '#3B82F6' },
          ].map(s => (
            <div key={s.label} className="stat-card text-center">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                style={{ background: `${s.color}18` }}>
                <s.icon className="h-5 w-5" style={{ color: s.color }} />
              </div>
              <p className="text-xl font-extrabold text-slate-900"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                {s.value}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Active Job Alert ────────────────────────── */}
        {activeJobs.length > 0 && (
          <button onClick={() => setActiveTab('myjobs')}
            className="w-full mb-6 rounded-xl p-4 flex items-center justify-between
              cursor-pointer hover:shadow-md transition-all animate-fade-in text-left"
            style={{ background: '#F5F3FF', border: '2px solid #C4B5FD' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center animate-pulse-orange"
                style={{ background: '#7C3AED' }}>
                <Truck className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-violet-900 text-sm">
                  {activeJobs.length} job{activeJobs.length > 1 ? 's' : ''} in progress
                </p>
                <p className="text-violet-500 text-xs">Tap to manage your active jobs</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-violet-400" />
          </button>
        )}

        {/* ── Tabs ────────────────────────────────────── */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'available', label: 'Available Jobs', count: availableJobs.length },
            { key: 'myjobs',    label: 'My Jobs',        count: myJobs.length },
          ].map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg
                text-sm font-semibold transition-all duration-150
                ${activeTab === tab.key
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'}`}>
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${activeTab === tab.key
                    ? 'text-white'
                    : 'bg-slate-200 text-slate-600'}`}
                  style={activeTab === tab.key ? { background: 'var(--orange)' } : {}}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Available Jobs ──────────────────────────── */}
        {activeTab === 'available' && (
          <div className="space-y-4 animate-fade-in">
            {availableJobs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100">
                  <Truck className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1"
                  style={{ fontFamily: 'Syne, sans-serif' }}>No jobs available</h3>
                <p className="text-slate-400 text-sm mb-5">New jobs will appear here when clients create bookings.</p>
                <button onClick={() => loadData(true)}
                  className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5
                    rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
              </div>
            ) : (
              availableJobs.map(job => (
                <JobCard key={job.id} job={job} onAccept={handleAcceptJob} />
              ))
            )}
          </div>
        )}

        {/* ── My Jobs ─────────────────────────────────── */}
        {activeTab === 'myjobs' && (
          <div className="space-y-3 animate-fade-in">
            {myJobs.length === 0 ? (
              <div className="rounded-2xl bg-white border border-slate-100 p-12 text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-slate-100">
                  <Package className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1"
                  style={{ fontFamily: 'Syne, sans-serif' }}>No jobs yet</h3>
                <p className="text-slate-400 text-sm">
                  Accept a job from the Available Jobs tab to get started.
                </p>
              </div>
            ) : (
              myJobs.map(job => (
                <DriverJobItem key={job.id} job={job} onUpdateStatus={handleUpdateStatus} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Driver Job Item ──────────────────────────────────────── */
function DriverJobItem({ job, onUpdateStatus }: {
  job: any;
  onUpdateStatus: (id: string, action: string) => Promise<void>;
}) {
  const [updating, setUpdating] = useState(false);
  const sc      = JOB_STATUS[job.status] || JOB_STATUS.accepted;
  const pickup  = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
  const earnings = job.total_amount * 0.7;

  async function act(action: string) {
    setUpdating(true);
    try { await onUpdateStatus(job.id, action); }
    finally { setUpdating(false); }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 transition-shadow hover:shadow-sm"
      style={{ borderLeft: `4px solid ${sc.leftColor}` }}>
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-sm"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {job.job_number}
            </span>
            <span className={sc.cls}>{sc.label}</span>
          </div>

          {/* Route */}
          <div className="space-y-1.5 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">P</span>
              <span className="truncate">{pickup?.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">D</span>
              <span className="truncate">{delivery?.address}</span>
            </div>
          </div>

          {/* Meta */}
          <p className="text-xs text-slate-400">
            {job.job_materials?.length} material(s) ·{' '}
            {job.total_weight_kg >= 1000
              ? `${(job.total_weight_kg / 1000).toFixed(2)}t`
              : `${job.total_weight_kg}kg`} ·{' '}
            {job.total_distance_km?.toFixed(1)}km
          </p>
        </div>

        {/* Earnings + Action */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xl font-extrabold text-green-600"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {formatKES(earnings)}
            </p>
            <p className="text-xs text-slate-400">your cut</p>
          </div>

          {job.status === 'accepted' && (
            <button onClick={() => act('start_transit')} disabled={updating}
              className="flex items-center gap-1.5 text-white text-xs font-semibold
                px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
              style={{ background: '#7C3AED', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}>
              {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '🚛'}
              Start Trip
            </button>
          )}

          {job.status === 'in_transit' && (
            <>
              <button onClick={() => act('deliver')} disabled={updating}
                className="flex items-center gap-1.5 text-white text-xs font-semibold
                  px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                style={{ background: '#10B981', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                {updating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '✅'}
                Delivered
              </button>
              <Link href={`/driver/jobs/${job.id}`}
                className="text-xs text-violet-600 hover:underline font-medium">
                Track live →
              </Link>
            </>
          )}

          {job.status === 'delivered' && (
            <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}