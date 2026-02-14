'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, MapPin, Phone, User, Truck, Clock } from 'lucide-react';
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

function formatWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} tonnes` : `${kg} kg`;
}

export default function AdminJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setJob(data.job);
      } catch {
        router.push('/admin/jobs');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [jobId]);

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const sc = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const pickup   = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="admin"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link href="/admin/jobs">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Jobs
          </Button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.job_number}</h1>
            <p className="text-slate-500 text-sm mt-1">
              Created {new Date(job.created_at).toLocaleDateString('en-KE', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full border ${sc.color}`}>
            {sc.label}
          </span>
        </div>

        {/* Client & Driver */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" /> Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.client?.user ? (
                <>
                  <p className="font-medium">{job.client.user.full_name}</p>
                  <p className="text-sm text-slate-500">{job.client.user.phone}</p>
                  {job.client.company_name && (
                    <p className="text-sm text-slate-400">{job.client.company_name}</p>
                  )}
                </>
              ) : (
                <p className="text-slate-400 text-sm">No client info</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="h-4 w-4 text-blue-500" /> Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.driver?.user ? (
                <>
                  <p className="font-medium">{job.driver.user.full_name}</p>
                  <p className="text-sm text-slate-500">{job.driver.user.phone}</p>
                </>
              ) : (
                <p className="text-slate-400 text-sm">
                  {job.status === 'pending' ? 'Awaiting driver' : 'No driver assigned'}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stops */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-construction-orange" /> Journey
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pickup && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{pickup.address}</p>
                  {pickup.contact_name && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {pickup.contact_name} · {pickup.contact_phone}
                    </p>
                  )}
                  {pickup.is_difficult_access && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ {pickup.access_notes}</p>
                  )}
                </div>
              </div>
            )}
            <div className="ml-3.5 w-0.5 h-5 bg-slate-200" />
            {delivery && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">D</span>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{delivery.address}</p>
                  {delivery.contact_name && (
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Phone className="h-3 w-3" /> {delivery.contact_name} · {delivery.contact_phone}
                    </p>
                  )}
                  {delivery.is_difficult_access && (
                    <p className="text-xs text-yellow-600 mt-1">⚠️ {delivery.access_notes}</p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-6 pt-2 border-t text-sm text-slate-500">
              <span>📍 {job.total_distance_km?.toFixed(1)} km</span>
              <span>⏱️ {job.estimated_duration_minutes} min</span>
              <span>⚖️ {formatWeight(job.total_weight_kg)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-construction-orange" /> Materials
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.job_materials?.map((jm: any) => (
                <div key={jm.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{jm.material?.name}</p>
                    <p className="text-slate-400">Qty: {jm.quantity} × {jm.unit_weight_kg}kg</p>
                  </div>
                  <span className="text-slate-600">{formatWeight(jm.total_weight_kg)}</span>
                </div>
              ))}
            </div>
            {job.special_instructions && (
              <div className="mt-4 pt-4 border-t text-sm">
                <p className="text-xs text-slate-500 uppercase font-medium mb-1">Special Instructions</p>
                <p className="text-slate-700">{job.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {[
              ['Base Fee',          job.base_fee],
              ['Distance Fee',      job.distance_fee],
              ['Handling Fee',      job.handling_fee],
              ['Platform Fee (20%)',job.platform_fee],
            ].map(([label, value]: any) => value > 0 && (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span>{formatKES(value)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-construction-orange">{formatKES(job.total_amount)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Driver Earnings (70%)</span>
              <span>{formatKES(job.total_amount * 0.7)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}