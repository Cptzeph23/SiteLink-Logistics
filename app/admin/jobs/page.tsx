'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800 border-green-300' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 border-red-300' },
};

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function AdminJobsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') { router.push('/login'); return; }
        setUser(currentUser);
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
        setFiltered(data.jobs || []);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  useEffect(() => {
    setFiltered(filter === 'all' ? jobs : jobs.filter(j => j.status === filter));
  }, [filter, jobs]);

  if (loading) return <LoadingPage />;

  const counts = {
    all:        jobs.length,
    pending:    jobs.filter(j => j.status === 'pending').length,
    accepted:   jobs.filter(j => j.status === 'accepted').length,
    in_transit: jobs.filter(j => j.status === 'in_transit').length,
    delivered:  jobs.filter(j => j.status === 'delivered').length,
    cancelled:  jobs.filter(j => j.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="admin"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">All Jobs</h1>
          <span className="text-slate-500">{filtered.length} of {jobs.length} jobs</span>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {Object.entries(counts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize
                ${filter === status
                  ? 'bg-construction-orange text-white'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
            >
              {status === 'all' ? 'All' : STATUS_CONFIG[status]?.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs
                ${filter === status ? 'bg-white/30' : 'bg-slate-100'}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Jobs List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((job: any) => {
              const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const pickup   = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
              const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

              return (
                <Card key={job.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-slate-800">{job.job_number}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                            {sc.label}
                          </span>
                          <span className="text-xs text-slate-400">
                            {new Date(job.created_at).toLocaleDateString('en-KE')}
                          </span>
                        </div>

                        <div className="text-sm text-slate-600 space-y-1">
                          {pickup && (
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">P</span>
                              {pickup.address}
                            </div>
                          )}
                          {delivery && (
                            <div className="flex items-center gap-2">
                              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">D</span>
                              {delivery.address}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-slate-400">
                          {job.total_distance_km?.toFixed(1)} km ·{' '}
                          {job.total_weight_kg >= 1000
                            ? `${(job.total_weight_kg / 1000).toFixed(2)}t`
                            : `${job.total_weight_kg}kg`} ·{' '}
                          {job.job_materials?.length || 0} material type(s)
                        </div>
                      </div>

                      <div className="flex flex-col items-end justify-between gap-2">
                        <span className="text-xl font-bold text-construction-orange">
                          {formatKES(job.total_amount)}
                        </span>
                        <Link href={`/admin/jobs/${job.id}`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}