'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { LiveTrackingMap } from '@/components/shared/LiveTrackingMap';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Package, MapPin, Clock,
  Phone, Truck, CheckCircle, User, Smartphone, ArrowRight
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'Awaiting Driver',  color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  accepted:   { label: 'Driver Assigned',  color: 'bg-blue-100 text-blue-800 border-blue-300',       icon: Truck },
  in_transit: { label: 'On The Way',       color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Truck },
  delivered:  { label: 'Delivered',        color: 'bg-green-100 text-green-800 border-green-300',    icon: CheckCircle },
  cancelled:  { label: 'Cancelled',        color: 'bg-red-100 text-red-800 border-red-300',          icon: Clock },
};

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} tonnes` : `${kg} kg`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function ClientJobDetailPage() {
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
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setJob(data.job);
      } catch {
        router.push('/client/bookings');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [jobId]);

  // Refresh job status every 15 seconds when active
  useEffect(() => {
    if (!job || ['delivered', 'cancelled'].includes(job?.status)) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      const data = await res.json();
      if (data.job) setJob(data.job);
    }, 15000);
    return () => clearInterval(interval);
  }, [job?.status, jobId]);

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const statusConfig = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const StatusIcon = statusConfig.icon;
  const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

  // Build stops for map with parsed coordinates
  const mapStops = job.job_stops?.map((stop: any) => {
    const match = stop.location?.match(/POINT\(([^ ]+) ([^)]+)\)/);
    return {
      ...stop,
      latitude: match ? parseFloat(match[2]) : undefined,
      longitude: match ? parseFloat(match[1]) : undefined,
    };
  }) || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back Button */}
        <Link href="/client/bookings">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bookings
          </Button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.job_number}</h1>
            <p className="text-slate-500 text-sm mt-1">Created {formatDate(job.created_at)}</p>
          </div>
          <span className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border ${statusConfig.color}`}>
            <StatusIcon className="h-4 w-4" />
            {statusConfig.label}
          </span>
        </div>

        {/* Payment Alert for Delivered Jobs */}
        {job.status === 'delivered' && (
          <PaymentAlert jobId={job.id} totalAmount={job.total_amount} />
        )}

        {/* Tracking Map */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-construction-orange" />
              Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LiveTrackingMap
              jobId={job.id}
              stops={mapStops}
              isInTransit={job.status === 'in_transit'}
            />
          </CardContent>
        </Card>

        {/* Journey Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Journey Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pickup */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{pickup?.address}</p>
                {pickup?.contact_name && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {pickup.contact_name} · {pickup.contact_phone}
                  </p>
                )}
                {pickup?.is_difficult_access && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Difficult access: {pickup.access_notes}</p>
                )}
              </div>
            </div>

            <div className="ml-4 w-0.5 h-6 bg-slate-200" />

            {/* Delivery */}
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">D</span>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{delivery?.address}</p>
                {delivery?.contact_name && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="h-3 w-3" />
                    {delivery.contact_name} · {delivery.contact_phone}
                  </p>
                )}
                {delivery?.is_difficult_access && (
                  <p className="text-xs text-yellow-600 mt-1">⚠️ Difficult access: {delivery.access_notes}</p>
                )}
              </div>
            </div>

            {/* Distance & Duration */}
            <div className="flex gap-6 pt-2 border-t text-sm text-slate-500">
              <span>📍 {job.total_distance_km?.toFixed(1)} km</span>
              <span>⏱️ Est. {job.estimated_duration_minutes} min</span>
              <span>⚖️ {formatWeight(job.total_weight_kg)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Driver Info (if assigned) */}
        {job.driver && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-4 w-4 text-construction-orange" />
                Your Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-construction-orange flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {job.driver?.user?.full_name || 'Driver'}
                  </p>
                  {job.driver?.user?.phone && (
                    <a
                      href={`tel:${job.driver.user.phone}`}
                      className="text-construction-orange text-sm flex items-center gap-1 hover:underline"
                    >
                      <Phone className="h-3 w-3" />
                      {job.driver.user.phone}
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Materials */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-construction-orange" />
              Materials ({job.job_materials?.length} type{job.job_materials?.length !== 1 ? 's' : ''})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.job_materials?.map((jm: any) => (
                <div key={jm.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-slate-800">{jm.material?.name}</p>
                    <p className="text-xs text-slate-500">
                      {jm.quantity} × {jm.unit_weight_kg} kg each
                    </p>
                  </div>
                  <span className="text-sm text-slate-600">{formatWeight(jm.total_weight_kg)}</span>
                </div>
              ))}
            </div>
            {job.special_instructions && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-slate-500 font-medium uppercase mb-1">Special Instructions</p>
                <p className="text-sm text-slate-700">{job.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proof of Delivery */}
        {job.status === 'delivered' && (
          <ProofOfDeliveryCard jobId={jobId} />
        )}

        {/* Price Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Price Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Base Fee</span>
              <span>{formatKES(job.base_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Distance Fee</span>
              <span>{formatKES(job.distance_fee)}</span>
            </div>
            {job.handling_fee > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-600">Handling Fee</span>
                <span>{formatKES(job.handling_fee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600">Platform Fee (20%)</span>
              <span>{formatKES(job.platform_fee)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-construction-orange">{formatKES(job.total_amount)}</span>
            </div>
            <p className="text-xs text-slate-400 pt-1">
              Payment via M-Pesa upon delivery
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Payment Alert Component
function PaymentAlert({ jobId, totalAmount }: { jobId: string; totalAmount: number }) {
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch(`/api/payments/status?job_id=${jobId}`);
        const data = await res.json();
        setPaymentStatus(data);
      } catch (err) {
        console.error('Payment status check failed:', err);
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
  }, [jobId]);

  if (loading) return null;

  if (paymentStatus?.is_paid) {
    return (
      <div className="mb-6 p-4 bg-green-50 border-2 border-green-400 rounded-xl flex items-center gap-3 animate-fade-in">
        <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
        <div>
          <p className="font-bold text-green-900 text-sm">Payment Completed</p>
          <p className="text-green-600 text-xs">
            Receipt: {paymentStatus.payment.mpesa_receipt_number}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/client/bookings/${jobId}/payment`}>
      <div className="mb-6 p-4 rounded-xl flex items-center justify-between cursor-pointer
        transition-all hover:shadow-md animate-fade-in"
        style={{ background: 'linear-gradient(135deg, #FF6B35 0%, #E55A26 100%)', color: 'white' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold text-sm">Payment Required</p>
            <p className="text-white/80 text-xs">
              Pay {`KSh ${totalAmount.toLocaleString('en-KE')}`} via M-Pesa
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5" />
      </div>
    </Link>
  );
}

// Proof of Delivery Card Component
function ProofOfDeliveryCard({ jobId }: { jobId: string }) {
  const [pod, setPod] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPod() {
      try {
        const res = await fetch(`/api/proof-of-delivery?job_id=${jobId}`);
        const data = await res.json();
        setPod(data.pod);
      } catch (err) {
        console.error('Failed to load PoD:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPod();
  }, [jobId]);

  if (loading) {
    return (
      <Card className="border-2 border-green-400 bg-green-50 animate-pulse">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-green-600">Loading delivery confirmation...</p>
        </CardContent>
      </Card>
    );
  }

  if (!pod) {
    return null;
  }

  return (
    <Card className="border-2 border-green-400 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" /> Delivery Confirmed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-green-600 font-medium mb-1">Received By</p>
            <p className="font-semibold text-green-900">{pod.recipient_name}</p>
            {pod.recipient_phone && (
              <p className="text-xs text-green-600 mt-0.5">{pod.recipient_phone}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-green-600 font-medium mb-1">Delivered At</p>
            <p className="font-semibold text-green-900">
              {new Date(pod.delivered_at).toLocaleString('en-KE', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {pod.notes && (
          <div className="pt-3 border-t border-green-200">
            <p className="text-xs text-green-600 font-medium mb-1">Delivery Notes</p>
            <p className="text-sm text-green-800">{pod.notes}</p>
          </div>
        )}

        {pod.photo_url && (
          <div className="pt-3 border-t border-green-200">
            <p className="text-xs text-green-600 font-medium mb-2">Delivery Photo</p>
            <img
              src={pod.photo_url}
              alt="Delivery confirmation"
              className="w-full rounded-lg border border-green-200"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}