'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Navigation, MapPin, Package,
  Phone, AlertTriangle, CheckCircle, Loader2,
  Play, Flag
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(amount: number) {
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 0 })}`;
}

function formatWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(2)} tonnes` : `${kg} kg`;
}

export default function DriverJobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'driver') {
          router.push('/login');
          return;
        }
        setUser(currentUser);
        await loadJob();
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    init();

    // Cleanup tracking on unmount
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [jobId]);

  async function loadJob() {
    const res = await fetch(`/api/jobs/${jobId}`);
    const data = await res.json();
    if (data.job) setJob(data.job);
  }

  async function handleAction(action: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setJob(data.job);

      // If starting transit, begin GPS tracking
      if (action === 'start_transit') {
        startGPSTracking();
      }

      // If delivered, stop tracking
      if (action === 'deliver') {
        stopGPSTracking();
        // Redirect to dashboard after delivery
        setTimeout(() => router.push('/driver/dashboard'), 2000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update job');
    } finally {
      setUpdating(false);
    }
  }

  function startGPSTracking() {
    if (!navigator.geolocation) {
      setGpsError('GPS not available on this device');
      return;
    }

    setTracking(true);
    setGpsError('');

    // Send location immediately
    sendLocation();

    // Then send every 10 seconds
    trackingIntervalRef.current = setInterval(sendLocation, 10000);
  }

  function stopGPSTracking() {
    setTracking(false);
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }

  function sendLocation() {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, speed, heading, accuracy } = position.coords;

        setLastLocation({ lat: latitude, lng: longitude });

        try {
          await fetch('/api/tracking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              job_id: jobId,
              latitude,
              longitude,
              speed_kmh: speed ? speed * 3.6 : 0, // Convert m/s to km/h
              heading: heading || 0,
              accuracy_meters: accuracy || 0,
            }),
          });
        } catch (err) {
          console.error('Failed to send location:', err);
        }
      },
      (err) => {
        console.error('GPS error:', err);
        setGpsError('Unable to get GPS location. Check location permissions.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  }

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const pickup = job.job_stops?.find((s: any) => s.stop_type === 'pickup');
  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');
  const driverEarnings = job.total_amount * 0.7;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="driver"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back Button */}
        <Link href="/driver/dashboard">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{job.job_number}</h1>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatKES(driverEarnings)}
              <span className="text-sm font-normal text-slate-500 ml-2">your earnings</span>
            </p>
          </div>
          <span className={`text-sm font-medium px-3 py-1.5 rounded-full border capitalize
            ${job.status === 'in_transit' ? 'bg-purple-100 text-purple-800 border-purple-300' :
              job.status === 'accepted' ? 'bg-blue-100 text-blue-800 border-blue-300' :
              job.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-300' :
              'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>

        {/* GPS Tracking Status */}
        {job.status === 'in_transit' && (
          <Card className={`mb-6 border-2 ${tracking ? 'border-green-400 bg-green-50' : 'border-yellow-400 bg-yellow-50'}`}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${tracking ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-sm">
                      {tracking ? 'GPS Tracking Active' : 'GPS Tracking Paused'}
                    </p>
                    {lastLocation && (
                      <p className="text-xs text-slate-500">
                        {lastLocation.lat.toFixed(5)}, {lastLocation.lng.toFixed(5)}
                      </p>
                    )}
                    {gpsError && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {gpsError}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={tracking ? stopGPSTracking : startGPSTracking}
                  className={tracking ? 'border-red-300 text-red-600' : 'border-green-400 text-green-700'}
                >
                  <Navigation className="h-3 w-3 mr-1" />
                  {tracking ? 'Pause' : 'Resume'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {job.status === 'accepted' && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardContent className="py-4">
              <p className="text-sm text-blue-700 mb-3">
                Ready to pick up the materials? Press Start Trip when you've loaded everything.
              </p>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleAction('start_transit')}
                disabled={updating}
              >
                {updating
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Starting...</>
                  : <><Play className="h-4 w-4 mr-2" /> Start Trip (Begin GPS Tracking)</>
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {job.status === 'in_transit' && (
          <Card className="mb-6 border-2 border-green-200 bg-green-50">
            <CardContent className="py-4">
              <p className="text-sm text-green-700 mb-3">
                Once all materials have been safely unloaded and delivered, press Mark Delivered.
              </p>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleAction('deliver')}
                disabled={updating}
              >
                {updating
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Completing...</>
                  : <><Flag className="h-4 w-4 mr-2" /> Mark as Delivered</>
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {job.status === 'delivered' && (
          <Card className="mb-6 border-2 border-green-400 bg-green-50">
            <CardContent className="py-4 text-center">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Job Completed!</p>
              <p className="text-sm text-green-600">
                You earned {formatKES(driverEarnings)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pickup Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              Pickup Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-slate-800">{pickup?.address}</p>
            {pickup?.contact_name && (
              <a href={`tel:${pickup.contact_phone}`}
                className="flex items-center gap-2 text-construction-orange hover:underline text-sm">
                <Phone className="h-4 w-4" />
                {pickup.contact_name} · {pickup.contact_phone}
              </a>
            )}
            {pickup?.is_difficult_access && (
              <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Difficult access: {pickup.access_notes || 'Check with client'}</span>
              </div>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pickup?.address || '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <MapPin className="h-4 w-4" /> Navigate to Pickup →
            </a>
          </CardContent>
        </Card>

        {/* Delivery Details */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">D</span>
              </div>
              Delivery Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-medium text-slate-800">{delivery?.address}</p>
            {delivery?.contact_name && (
              <a href={`tel:${delivery.contact_phone}`}
                className="flex items-center gap-2 text-construction-orange hover:underline text-sm">
                <Phone className="h-4 w-4" />
                {delivery.contact_name} · {delivery.contact_phone}
              </a>
            )}
            {delivery?.is_difficult_access && (
              <div className="flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>Difficult access: {delivery.access_notes || 'Check with client'}</span>
              </div>
            )}
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery?.address || '')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <MapPin className="h-4 w-4" /> Navigate to Delivery →
            </a>
          </CardContent>
        </Card>

        {/* Materials */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-construction-orange" />
              Load Manifest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {job.job_materials?.map((jm: any) => (
                <div key={jm.id} className="flex justify-between py-2 border-b last:border-0 text-sm">
                  <div>
                    <p className="font-medium">{jm.material?.name}</p>
                    <p className="text-slate-400">Qty: {jm.quantity}</p>
                  </div>
                  <span className="text-slate-600">{formatWeight(jm.total_weight_kg)}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between font-semibold text-sm">
              <span>Total Load</span>
              <span className={job.total_weight_kg > 2000 ? 'text-yellow-600' : 'text-slate-800'}>
                {formatWeight(job.total_weight_kg)}
                {job.total_weight_kg > 2000 && ' ⚠️'}
              </span>
            </div>
            {job.special_instructions && (
              <div className="mt-3 pt-3 border-t text-sm">
                <p className="text-slate-500 font-medium uppercase text-xs mb-1">Driver Notes</p>
                <p className="text-slate-700">{job.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}