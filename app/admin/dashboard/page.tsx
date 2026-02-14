'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, Truck, Package, TrendingUp,
  Clock, CheckCircle, AlertTriangle,
  RefreshCw, Loader2, ArrowRight
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800 border-green-300' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 border-red-300' },
};

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function StatCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadStats(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        await loadStats();
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  if (loading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="admin"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 mt-1">Platform overview and management</p>
          </div>
          <Button variant="outline" onClick={() => loadStats(true)} disabled={refreshing}>
            {refreshing
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
        </div>

        {stats && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Total Users"
                value={stats.users.total}
                sub={`${stats.users.clients} clients · ${stats.users.drivers} drivers`}
                icon={Users}
                color="bg-blue-100 text-blue-600"
              />
              <StatCard
                title="Total Jobs"
                value={stats.jobs.total}
                sub={`${stats.jobs.completed} completed`}
                icon={Package}
                color="bg-purple-100 text-purple-600"
              />
              <StatCard
                title="Platform Revenue"
                value={formatKES(stats.revenue.this_month)}
                sub="This month"
                icon={TrendingUp}
                color="bg-green-100 text-green-600"
              />
              <StatCard
                title="Active Jobs"
                value={stats.jobs.active}
                sub={`${stats.jobs.pending} pending drivers`}
                icon={Truck}
                color="bg-orange-100 text-orange-600"
              />
            </div>

            {/* Job Status Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Job Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Pending',    count: stats.jobs.pending,   color: 'bg-yellow-500', pct: stats.jobs.total },
                    { label: 'Active',     count: stats.jobs.active,    color: 'bg-blue-500',   pct: stats.jobs.total },
                    { label: 'Delivered',  count: stats.jobs.completed, color: 'bg-green-500',  pct: stats.jobs.total },
                    { label: 'Cancelled',  count: stats.jobs.cancelled, color: 'bg-red-400',    pct: stats.jobs.total },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium">{item.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`${item.color} h-2 rounded-full transition-all`}
                          style={{ width: item.pct > 0 ? `${(item.count / item.pct) * 100}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-slate-600">This Month (Platform Fee)</span>
                    <span className="font-bold text-green-600 text-lg">
                      {formatKES(stats.revenue.this_month)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <span className="text-slate-600">All Time (Total Billed)</span>
                    <span className="font-bold text-slate-800 text-lg">
                      {formatKES(stats.revenue.all_time)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-slate-600">Completed Jobs</span>
                    <span className="font-bold text-slate-800">{stats.jobs.completed}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Recent Jobs</CardTitle>
                <Link href="/admin/jobs">
                  <Button variant="ghost" size="sm" className="text-construction-orange">
                    View All <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {stats.recent_jobs.length === 0 ? (
                  <p className="text-center text-slate-400 py-8">No jobs yet</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recent_jobs.map((job: any) => {
                      const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
                      const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
                      const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
                      return (
                        <div key={job.id} className="flex items-center justify-between py-3 border-b last:border-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-slate-800">{job.job_number}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate">
                              {pickup?.address} → {delivery?.address}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {job.client?.user?.full_name} · {new Date(job.created_at).toLocaleDateString('en-KE')}
                            </p>
                          </div>
                          <span className="font-bold text-construction-orange ml-4 flex-shrink-0">
                            {formatKES(job.total_amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <Link href="/admin/jobs">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-construction-orange">
                  <CardContent className="flex items-center gap-4 py-5">
                    <Package className="h-8 w-8 text-construction-orange" />
                    <div>
                      <p className="font-semibold">Manage Jobs</p>
                      <p className="text-sm text-slate-500">View and manage all platform jobs</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 ml-auto" />
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                  <CardContent className="flex items-center gap-4 py-5">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-semibold">Manage Users</p>
                      <p className="text-sm text-slate-500">Clients, drivers and verification</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 ml-auto" />
                  </CardContent>
                </Card>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}