'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, CheckCircle, Package, ArrowLeft } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function DriverEarningsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'driver') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <LoadingPage />;

  const completedJobs  = jobs.filter(j => j.status === 'delivered');
  const totalEarnings  = completedJobs.reduce((sum, j) => sum + j.total_amount * 0.7, 0);
  const thisMonth      = completedJobs.filter(j => {
    const d = new Date(j.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthEarnings  = thisMonth.reduce((sum, j) => sum + j.total_amount * 0.7, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="driver"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link href="/driver/dashboard">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-6">My Earnings</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-2xl font-bold text-green-600">{formatKES(totalEarnings)}</p>
              <p className="text-sm text-slate-500 mt-1">All Time Earnings</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <CheckCircle className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-blue-600">{formatKES(monthEarnings)}</p>
              <p className="text-sm text-slate-500 mt-1">This Month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{completedJobs.length}</p>
              <p className="text-sm text-slate-500 mt-1">Jobs Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{thisMonth.length}</p>
              <p className="text-sm text-slate-500 mt-1">This Month</p>
            </CardContent>
          </Card>
        </div>

        {/* Completed Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Completed Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {completedJobs.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No completed jobs yet</p>
                <Link href="/driver/dashboard">
                  <Button variant="outline" className="mt-4" size="sm">
                    Find Available Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {completedJobs.map((job: any) => {
                  const pickup   = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
                  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
                  const earnings = job.total_amount * 0.7;

                  return (
                    <div key={job.id} className="flex justify-between items-start py-3 border-b last:border-0">
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="font-medium text-slate-800 text-sm">{job.job_number}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {pickup?.address} → {delivery?.address}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {new Date(job.created_at).toLocaleDateString('en-KE', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })} · {job.total_distance_km?.toFixed(1)} km
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600">{formatKES(earnings)}</p>
                        <p className="text-xs text-slate-400">of {formatKES(job.total_amount)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          Driver earnings are 70% of the total job amount. Platform fee is 30%.
        </p>
      </div>
    </div>
  );
}