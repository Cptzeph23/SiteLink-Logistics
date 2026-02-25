'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, TrendingDown, MapPin, DollarSign,
  Loader2, CheckCircle, Clock 
} from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

function formatKES(n: number) {
  return `KSh ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

export default function CreateReturnTripPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [distance, setDistance] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('20');

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'driver') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        // Fetch job details
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        if (data.job.status !== 'delivered') {
          alert('Job must be delivered to create return trip');
          router.push(`/driver/jobs/${jobId}`);
          return;
        }

        setJob(data.job);

        // Pre-fill with reverse route
        const delivery = data.job.job_stops?.find((s: any) => s.stop_type === 'delivery');
        const pickup = data.job.job_stops?.find((s: any) => s.stop_type === 'pickup');
        
        if (delivery && pickup) {
          setPickupAddress(delivery.address); // Return from delivery location
          setDeliveryAddress(pickup.address); // Return to pickup location
        }

        // Estimate similar pricing
        setDistance(data.job.total_distance_km.toFixed(1));
        setOriginalPrice(data.job.subtotal.toFixed(0));

      } catch (err: any) {
        alert(err.message || 'Failed to load job');
        router.push('/driver/dashboard');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [jobId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      alert('Please enter pickup and delivery addresses');
      return;
    }

    const dist = parseFloat(distance);
    const price = parseFloat(originalPrice);
    const discount = parseFloat(discountPercentage);

    if (isNaN(dist) || dist <= 0) {
      alert('Please enter valid distance');
      return;
    }

    if (isNaN(price) || price <= 0) {
      alert('Please enter valid price');
      return;
    }

    if (isNaN(discount) || discount < 0 || discount > 50) {
      alert('Discount must be between 0% and 50%');
      return;
    }

    setSubmitting(true);
    try {
      // For simplicity, use center of Nairobi for coordinates
      // In production, you'd geocode the addresses
      const pickupLocation = { lat: -1.2921, lng: 36.8219 };
      const deliveryLocation = { lat: -1.2864, lng: 36.8172 };

      const res = await fetch('/api/return-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          original_job_id: jobId,
          pickup_address: pickupAddress.trim(),
          pickup_location: pickupLocation,
          delivery_address: deliveryAddress.trim(),
          delivery_location: deliveryLocation,
          distance_km: dist,
          original_price: price,
          discount_percentage: discount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert('Return trip offer created! It will be available to clients for 4 hours.');
      router.push('/driver/dashboard');

    } catch (err: any) {
      alert(err.message || 'Failed to create return trip');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const discountedPrice = parseFloat(originalPrice || '0') * (1 - parseFloat(discountPercentage || '0') / 100);
  const savings = parseFloat(originalPrice || '0') - discountedPrice;

  return (
    <div className="page-shell">
      <Navbar
        userRole="driver"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="page-content max-w-2xl">
        
        {/* Header */}
        <Link href={`/driver/jobs/${jobId}`}>
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Job
          </Button>
        </Link>

        <div className="mb-6 animate-fade-up">
          <p className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: 'var(--orange)' }}>
            Return Trip Offer
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Offer Return Trip
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Earn on your return journey • Reduce empty miles
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm animate-fade-up"
          style={{ animationDelay: '0.1s' }}>
          <p className="font-bold text-blue-900 mb-2">💡 How It Works</p>
          <ul className="space-y-1 text-blue-800 text-xs">
            <li>• Offer a discounted trip for your return journey</li>
            <li>• Clients see your offer in the marketplace</li>
            <li>• When accepted, a new booking is created automatically</li>
            <li>• Offer expires in 4 hours if not accepted</li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up"
          style={{ animationDelay: '0.2s' }}>

          {/* Pickup Address */}
          <div>
            <Label htmlFor="pickup" className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-500" />
              Pickup Location
            </Label>
            <Input
              id="pickup"
              placeholder="Where will you pick up materials?"
              value={pickupAddress}
              onChange={e => setPickupAddress(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* Delivery Address */}
          <div>
            <Label htmlFor="delivery" className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <MapPin className="h-4 w-4 text-red-500" />
              Delivery Location
            </Label>
            <Input
              id="delivery"
              placeholder="Where will you deliver?"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* Distance */}
          <div>
            <Label htmlFor="distance" className="text-sm font-semibold text-slate-700 mb-2 block">
              Distance (km)
            </Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              placeholder="15.5"
              value={distance}
              onChange={e => setDistance(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* Original Price */}
          <div>
            <Label htmlFor="price" className="text-sm font-semibold text-slate-700 mb-2 block">
              Regular Price (KSh)
            </Label>
            <Input
              id="price"
              type="number"
              step="1"
              placeholder="5000"
              value={originalPrice}
              onChange={e => setOriginalPrice(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">
              What you would normally charge for this trip
            </p>
          </div>

          {/* Discount Percentage */}
          <div>
            <Label htmlFor="discount" className="text-sm font-semibold text-slate-700 mb-2 block flex items-center gap-2">
              <TrendingDown className="h-4 w-4" style={{ color: 'var(--orange)' }} />
              Discount Percentage
            </Label>
            <div className="flex gap-3">
              {['15', '20', '25', '30'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDiscountPercentage(val)}
                  disabled={submitting}
                  className={`flex-1 h-12 rounded-xl border-2 font-semibold transition-all ${
                    discountPercentage === val
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-slate-200 hover:border-orange-200'
                  }`}>
                  {val}%
                </button>
              ))}
            </div>
            <Input
              id="discount"
              type="number"
              step="1"
              min="0"
              max="50"
              placeholder="20"
              value={discountPercentage}
              onChange={e => setDiscountPercentage(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white mt-3"
            />
            <p className="text-xs text-slate-400 mt-1">
              Recommended: 20-30% for good acceptance rate
            </p>
          </div>

          {/* Price Summary */}
          <div className="p-4 rounded-xl"
            style={{ background: 'var(--orange-light)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Regular Price</span>
              <span className="text-sm line-through text-slate-400">
                {formatKES(parseFloat(originalPrice || '0'))}
              </span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-green-700 font-semibold">
                Discount ({discountPercentage}%)
              </span>
              <span className="text-sm text-green-700 font-semibold">
                -{formatKES(savings)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-orange-200">
              <span className="font-bold text-slate-900">Your Earnings</span>
              <span className="text-2xl font-extrabold"
                style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)' }}>
                {formatKES(discountedPrice)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              + Platform fee ({formatKES(discountedPrice * 0.2)}) paid by client
            </p>
          </div>

          {/* Expiry Info */}
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <p className="text-xs">Offer expires in 4 hours if not accepted</p>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !pickupAddress.trim() || !deliveryAddress.trim()}
            className="w-full h-12 text-base font-semibold rounded-xl transition-all hover:-translate-y-0.5"
            style={{
              background: submitting ? '#CBD5E0' : 'var(--orange)',
              color: 'white',
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(255,107,53,0.35)',
            }}>
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Offer...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Create Return Trip Offer
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}