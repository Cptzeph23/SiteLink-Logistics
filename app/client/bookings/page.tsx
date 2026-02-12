'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Package, MapPin, Clock } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

// Status colors and labels
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  accepted:   { label: 'Accepted',   color: 'bg-blue-100 text-blue-800 border-blue-300' },
  in_transit: { label: 'In Transit', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-800 border-green-300' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-800 border-red-300' },
};

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const res = await fetch('/api/jobs');
        const data = await res.json();
        setJobs(data.jobs || []);
      } catch (err) {
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
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
            <p className="text-slate-600 mt-1">
              {jobs.length} booking{jobs.length !== 1 ? 's' : ''} total
            </p>
          </div>
          <Link href="/client/bookings/new">
            <Button className="bg-construction-orange hover:bg-construction-orange/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No bookings yet</h3>
              <p className="text-slate-500 mb-6">Create your first booking to transport materials</p>
              <Link href="/client/bookings/new">
                <Button className="bg-construction-orange hover:bg-construction-orange/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Booking
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job: any) => {
              const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
              const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
              const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

              return (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      {/* Left: Job Info */}
                      <div className="flex-1 space-y-3">
                        {/* Job number and status */}
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-900">{job.job_number}</span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        {/* Locations */}
                        <div className="space-y-1">
                          {pickup && (
                            <div className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">P</span>
                              </div>
                              <span className="text-slate-600">{pickup.address}</span>
                            </div>
                          )}
                          {delivery && (
                            <div className="flex items-start gap-2 text-sm">
                              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-white text-xs font-bold">D</span>
                              </div>
                              <span className="text-slate-600">{delivery.address}</span>
                            </div>
                          )}
                        </div>

                        {/* Materials summary */}
                        {job.job_materials?.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Package className="h-4 w-4" />
                            <span>
                              {job.job_materials.length} material type{job.job_materials.length !== 1 ? 's' : ''} •{' '}
                              {job.total_weight_kg >= 1000
                                ? `${(job.total_weight_kg / 1000).toFixed(2)} tonnes`
                                : `${job.total_weight_kg} kg`}
                            </span>
                          </div>
                        )}

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(job.created_at)}</span>
                        </div>
                      </div>

                      {/* Right: Price */}
                      <div className="flex flex-col items-end justify-between">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-construction-orange">
                            {formatKES(job.total_amount)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {job.total_distance_km?.toFixed(1)} km
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => router.push(`/client/bookings/${job.id}`)}
                        >
                          View Details
                        </Button>
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