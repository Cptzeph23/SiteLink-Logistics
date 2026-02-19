'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { JobCard } from '@/components/driver/JobCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Truck, CheckCircle, Clock,
  RefreshCw, Loader2, TrendingUp
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [myJobs, setMyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'myjobs'>('available');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // Fetch available jobs and driver's own jobs in parallel
      const [availableRes, myJobsRes] = await Promise.all([
        fetch('/api/jobs/available'),
        fetch('/api/jobs'),
      ]);

      const availableData = await availableRes.json();
      const myJobsData = await myJobsRes.json();

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
          router.push('/login');
          return;
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

      // Refresh jobs list
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

  // Stats from driver's jobs
  const completedJobs = myJobs.filter(j => j.status === 'delivered').length;
  const activeJobs = myJobs.filter(j => ['accepted', 'in_transit'].includes(j.status));
  const totalEarnings = myJobs
    .filter(j => j.status === 'delivered')
    .reduce((sum, j) => sum + (j.total_amount * 0.7), 0);

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="driver"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Driver Dashboard
            </h1>
            <p className="text-slate-600 mt-1">Welcome back, {user?.full_name}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => loadData(true)}
            disabled={refreshing}
          >
            {refreshing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />
            }
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Truck className="h-8 w-8 text-construction-orange mx-auto mb-2" />
              <p className="text-2xl font-bold">{availableJobs.length}</p>
              <p className="text-xs text-slate-500">Available Jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{completedJobs}</p>
              <p className="text-xs text-slate-500">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-bold text-green-600">
                KSh {totalEarnings.toLocaleString('en-KE', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-500">Total Earned</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Jobs Alert */}
        {activeJobs.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="font-semibold text-blue-800 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              You have {activeJobs.length} active job{activeJobs.length > 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-2 border-blue-300 text-blue-700"
              onClick={() => setActiveTab('myjobs')}
            >
              View Active Jobs
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'available'
                ? 'bg-construction-orange text-white'
                : 'bg-white text-slate-600 border hover:bg-slate-50'
            }`}
          >
            Available Jobs
            {availableJobs.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'available' ? 'bg-white/30' : 'bg-construction-orange text-white'
              }`}>
                {availableJobs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('myjobs')}
            className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors ${
              activeTab === 'myjobs'
                ? 'bg-construction-orange text-white'
                : 'bg-white text-slate-600 border hover:bg-slate-50'
            }`}
          >
            My Jobs
            {myJobs.length > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'myjobs' ? 'bg-white/30' : 'bg-slate-200 text-slate-600'
              }`}>
                {myJobs.length}
              </span>
            )}
          </button>
        </div>

        {/* Available Jobs Tab */}
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableJobs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">No jobs available</h3>
                  <p className="text-slate-500 mt-2">Check back soon for new jobs</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => loadData(true)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                  </Button>
                </CardContent>
              </Card>
            ) : (
              availableJobs.map((job) => (
                <JobCard key={job.id} job={job} onAccept={handleAcceptJob} />
              ))
            )}
          </div>
        )}

        {/* My Jobs Tab */}
        {activeTab === 'myjobs' && (
          <div className="space-y-4">
            {myJobs.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <CheckCircle className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">No jobs yet</h3>
                  <p className="text-slate-500 mt-2">Accept jobs from the Available Jobs tab</p>
                </CardContent>
              </Card>
            ) : (
              myJobs.map((job: any) => (
                <DriverJobItem
                  key={job.id}
                  job={job}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================
// Driver Job Item Component (for accepted/in-transit/delivered jobs)
// =============================================
function DriverJobItem({
  job,
  onUpdateStatus,
}: {
  job: any;
  onUpdateStatus: (id: string, action: string) => Promise<void>;
}) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-800 border-blue-300' },
    in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800 border-green-300' },
    cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 border-red-300' },
  };

  const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.accepted;

  async function handleAction(action: string) {
    setUpdating(true);
    try {
      await onUpdateStatus(job.id, action);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <Card className={`border-l-4 ${
      job.status === 'in_transit' ? 'border-l-purple-500' :
      job.status === 'delivered' ? 'border-l-green-500' :
      job.status === 'accepted' ? 'border-l-blue-500' : 'border-l-slate-300'
    }`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-3">
            {/* Job number and status */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-800">{job.job_number}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full border ${status.color}`}>
                {status.label}
              </span>
            </div>

            {/* Locations */}
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span className="text-slate-600">{pickup?.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <span className="text-slate-600">{delivery?.address}</span>
              </div>
            </div>

            {/* Materials */}
            <div className="text-xs text-slate-500">
              {job.job_materials?.length} material type(s) ·{' '}
              {job.total_weight_kg >= 1000
                ? `${(job.total_weight_kg / 1000).toFixed(2)} tonnes`
                : `${job.total_weight_kg} kg`}
              · {job.total_distance_km?.toFixed(1)} km
            </div>
          </div>

          {/* Right: Earnings and Action */}
          <div className="flex flex-col items-end gap-3">
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                KSh {(job.total_amount * 0.7).toLocaleString('en-KE', { maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-slate-400">your earnings</p>
            </div>

            {/* Action Buttons based on status */}
            {job.status === 'accepted' && (
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleAction('start_transit')}
                disabled={updating}
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚛 Start Trip'}
              </Button>
            )}

            {job.status === 'in_transit' && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => router.push(`/driver/jobs/${job.id}/deliver`)}
                disabled={updating}
              >
                 Mark Delivered
              </Button>
            )}

            {job.status === 'delivered' && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="h-4 w-4" /> Complete
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}