'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, MapPin, TrendingDown, Clock, 
  Truck, CheckCircle, Loader2 
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function formatDistance(km: number) {
  return `${km.toFixed(1)} km`;
}

function formatTimeLeft(expiresAt: string) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const hoursLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60)) % 60;
  
  if (hoursLeft <= 0 && minutesLeft <= 0) return 'Expired';
  if (hoursLeft > 0) return `${hoursLeft}h ${minutesLeft}m left`;
  return `${minutesLeft}m left`;
}

export default function ReturnTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [returnTrips, setReturnTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Fetch return trips
        const res = await fetch('/api/return-trips');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setReturnTrips(data.return_trips || []);
      } catch (err: any) {
        alert(err.message || 'Failed to load return trips');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function handleAccept(tripId: string) {
    if (!confirm('Accept this return trip offer? A new booking will be created.')) {
      return;
    }

    setAccepting(tripId);
    try {
      const res = await fetch(`/api/return-trips/${tripId}/accept`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Return trip accepted! Check your bookings.');
      router.push('/client/bookings');
    } catch (err: any) {
      alert(err.message || 'Failed to accept return trip');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div className="page-shell">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="page-content">
        {/* Header */}
        <Link href="/client/dashboard">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--orange)' }}>
            Return Trip Marketplace
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Discounted Return Trips
          </h1>
          <p className="text-slate-500 mt-2">
            Drivers heading back empty offer discounted trips. Save money, reduce empty miles! 🚛
          </p>
        </div>

        {/* Return Trips List */}
        {returnTrips.length === 0 ? (
          <div className="job-card text-center py-12 animate-fade-up"
            style={{ animationDelay: '0.1s' }}>
            <Truck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-bold text-slate-700 mb-2">No Return Trips Available</h3>
            <p className="text-slate-500 text-sm">
              Check back later for discounted return trip offers from drivers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {returnTrips.map((trip, idx) => {
              const savings = trip.original_price - trip.discounted_price;
              const savingsPercent = trip.discount_percentage;
              const driverUser = trip.driver_profile?.user;

              return (
                <div
                  key={trip.id}
                  className="job-card animate-fade-up"
                  style={{ animationDelay: `${0.1 + idx * 0.05}s` }}>
                  
                  {/* Discount Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--orange-light)' }}>
                        <TrendingDown className="h-5 w-5" style={{ color: 'var(--orange)' }} />
                      </div>
                      <div>
                        <p className="font-bold text-green-700 text-sm">
                          {savingsPercent}% OFF
                        </p>
                        <p className="text-xs text-slate-400">
                          Save {formatKES(savings)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 
                      px-2 py-1 rounded-full border border-amber-200">
                      <Clock className="h-3 w-3" />
                      {formatTimeLeft(trip.expires_at)}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">Pickup</p>
                        <p className="text-sm text-slate-700 font-medium">
                          {trip.pickup_address}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-400 mb-0.5">Delivery</p>
                        <p className="text-sm text-slate-700 font-medium">
                          {trip.delivery_address}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Distance</p>
                      <p className="font-semibold text-slate-700">
                        {formatDistance(trip.distance_km)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Driver</p>
                      <p className="font-semibold text-slate-700">
                        {driverUser?.full_name || 'Driver'}
                      </p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="mb-4 p-3 rounded-lg"
                    style={{ background: 'var(--orange-light)' }}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 line-through">
                        {formatKES(trip.original_price)}
                      </span>
                      <span className="text-2xl font-extrabold"
                        style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)' }}>
                        {formatKES(trip.discounted_price)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      + Platform fee ({formatKES(trip.discounted_price * 0.2)})
                    </p>
                  </div>

                  {/* Action */}
                  <Button
                    onClick={() => handleAccept(trip.id)}
                    disabled={accepting === trip.id}
                    className="w-full h-12 font-semibold rounded-xl transition-all hover:-translate-y-0.5"
                    style={{
                      background: accepting === trip.id ? '#CBD5E0' : 'var(--orange)',
                      color: 'white',
                      boxShadow: accepting === trip.id ? 'none' : '0 4px 16px rgba(255,107,53,0.35)',
                    }}>
                    {accepting === trip.id ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Accept Return Trip
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800">
          <p className="font-bold mb-2">💡 How Return Trips Work</p>
          <ul className="space-y-1 text-xs">
            <li>• Drivers offer discounted trips when heading back empty</li>
            <li>• Typically 20-30% cheaper than regular bookings</li>
            <li>• Pre-assigned driver (faster service)</li>
            <li>• Limited availability - accept quickly!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}