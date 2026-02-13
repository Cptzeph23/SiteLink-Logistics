'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage, LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { MaterialSelector } from '@/components/client/MaterialSelector';
import { PriceBreakdown } from '@/components/client/priceBreakdown';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, MapPin, Package, Calculator, CheckCircle, Loader2 } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';
import type { Material } from '@/types';

// Steps in the booking flow
const STEPS = [
  { id: 1, label: 'Materials',  icon: Package },
  { id: 2, label: 'Locations',  icon: MapPin },
  { id: 3, label: 'Quote',      icon: Calculator },
  { id: 4, label: 'Confirm',    icon: CheckCircle },
];

interface SelectedMaterial { material_id: string; quantity: number; }
interface Stop {
  stop_type: 'pickup' | 'delivery';
  address: string;
  location: { lat: number; lng: number };
  contact_name: string;
  contact_phone: string;
  is_difficult_access: boolean;
  access_notes: string;
}

export default function NewBookingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([
    { material_id: '', quantity: 1 },
  ]);
  const [stops, setStops] = useState<Stop[]>([
    { stop_type: 'pickup', address: '', location: { lat: 0, lng: 0 }, contact_name: '', contact_phone: '', is_difficult_access: false, access_notes: '' },
    { stop_type: 'delivery', address: '', location: { lat: 0, lng: 0 }, contact_name: '', contact_phone: '', is_difficult_access: false, access_notes: '' },
  ]);
  const [pricing, setPricing] = useState<any>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [overweightAcknowledged, setOverweightAcknowledged] = useState(false);
  const [distance, setDistance] = useState('');

  // Load user and materials
  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'client') {
          router.push('/login');
          return;
        }
        setUser(currentUser);

        const res = await fetch('/api/materials');
        const data = await res.json();
        setMaterials(data.materials || []);
      } catch (err) {
        router.push('/login');
      } finally {
        setPageLoading(false);
      }
    }
    init();
  }, []);

  // Validate each step before advancing
  function validateStep(step: number): string | null {
    if (step === 1) {
      const valid = selectedMaterials.filter(m => m.material_id && m.quantity > 0);
      if (valid.length === 0) return 'Please select at least one material.';
    }
    if (step === 2) {
      const pickup = stops.find(s => s.stop_type === 'pickup');
      const delivery = stops.find(s => s.stop_type === 'delivery');
      if (!pickup?.address) return 'Please enter a pickup address.';
      if (!delivery?.address) return 'Please enter a delivery address.';
      if (!distance || parseFloat(distance) <= 0) return 'Please enter the distance between locations.';
    }
    return null;
  }

  async function handleNextStep() {
    const err = validateStep(currentStep);
    if (err) { setError(err); return; }
    setError('');

    if (currentStep === 2) {
      // Calculate price when moving from locations to quote
      await calculatePrice();
    } else {
      setCurrentStep(s => s + 1);
    }
  }

  async function calculatePrice() {
    setCalculatingPrice(true);
    try {
      const validMaterials = selectedMaterials.filter(m => m.material_id && m.quantity > 0);
      const res = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: parseFloat(distance),
          materials: validMaterials,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPricing(data);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate price. Please try again.');
    } finally {
      setCalculatingPrice(false);
    }
  }

  async function handleSubmitJob() {
    if (pricing?.total_weight_kg > 2000 && !overweightAcknowledged) {
      setError('Please acknowledge the overweight warning to proceed.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const validMaterials = selectedMaterials.filter(m => m.material_id && m.quantity > 0);
      const validStops = stops.map(stop => ({
        ...stop,
        location: stop.location.lat === 0
          ? { lat: -1.286389, lng: 36.817223 } // Default to Nairobi if not geocoded
          : stop.location,
      }));

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materials: validMaterials,
          stops: validStops,
          pricing,
          special_instructions: specialInstructions,
          overweight_acknowledged: overweightAcknowledged,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Success - go to bookings list
      setCurrentStep(4);
      setTimeout(() => router.push('/client/bookings'), 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function updateStop(index: number, field: keyof Stop, value: any) {
    const updated = [...stops];
    updated[index] = { ...updated[index], [field]: value };
    setStops(updated);
  }

  if (pageLoading) return <LoadingPage />;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="client"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">New Booking</h1>
          <p className="text-slate-600 mt-1">Book a transport for your construction materials</p>
        </div>

        {/* Step Progress Indicator */}
        <div className="flex items-center mb-8">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                    ${isComplete ? 'bg-green-500 text-white' : isCurrent ? 'bg-construction-orange text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {isComplete ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-1 font-medium
                    ${isCurrent ? 'text-construction-orange' : isComplete ? 'text-green-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        {/* ===================== STEP 1: MATERIALS ===================== */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <MaterialSelector
              materials={materials}
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
              showWeight={true}
            />
          </div>
        )}

        {/* ===================== STEP 2: LOCATIONS ===================== */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Pickup Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  Pickup Location
                </CardTitle>
                <CardDescription>Where should the driver pick up the materials?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Pickup Address *</Label>
                  <Input
                    placeholder="e.g. ABC Hardware, Ngong Road, Nairobi"
                    value={stops[0].address}
                    onChange={(e) => updateStop(0, 'address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      placeholder="John Doe"
                      value={stops[0].contact_name}
                      onChange={(e) => updateStop(0, 'contact_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      placeholder="0712345678"
                      value={stops[0].contact_phone}
                      onChange={(e) => updateStop(0, 'contact_phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="pickup-difficult"
                    checked={stops[0].is_difficult_access}
                    onCheckedChange={(v) => updateStop(0, 'is_difficult_access', v)}
                  />
                  <Label htmlFor="pickup-difficult" className="font-normal cursor-pointer">
                    Difficult access (narrow road, weight limit, etc.)
                  </Label>
                </div>
                {stops[0].is_difficult_access && (
                  <Input
                    placeholder="Describe access challenges..."
                    value={stops[0].access_notes}
                    onChange={(e) => updateStop(0, 'access_notes', e.target.value)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Delivery Location */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">D</span>
                  </div>
                  Delivery Location
                </CardTitle>
                <CardDescription>Where should the materials be delivered?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Delivery Address *</Label>
                  <Input
                    placeholder="e.g. Plot 123, Karen, Nairobi"
                    value={stops[1].address}
                    onChange={(e) => updateStop(1, 'address', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contact Name</Label>
                    <Input
                      placeholder="Jane Doe"
                      value={stops[1].contact_name}
                      onChange={(e) => updateStop(1, 'contact_name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input
                      placeholder="0712345678"
                      value={stops[1].contact_phone}
                      onChange={(e) => updateStop(1, 'contact_phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="delivery-difficult"
                    checked={stops[1].is_difficult_access}
                    onCheckedChange={(v) => updateStop(1, 'is_difficult_access', v)}
                  />
                  <Label htmlFor="delivery-difficult" className="font-normal cursor-pointer">
                    Difficult access (construction site, narrow road, etc.)
                  </Label>
                </div>
                {stops[1].is_difficult_access && (
                  <Input
                    placeholder="Describe access challenges..."
                    value={stops[1].access_notes}
                    onChange={(e) => updateStop(1, 'access_notes', e.target.value)}
                  />
                )}
              </CardContent>
            </Card>

            {/* Distance Input */}
            <Card>
              <CardHeader>
                <CardTitle>Estimated Distance</CardTitle>
                <CardDescription>
                  Enter the approximate distance between pickup and delivery (you can check on Google Maps)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label>Distance (km) *</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      placeholder="e.g. 15.5"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                    />
                  </div>
                  <div className="text-sm text-slate-500 pb-2">
                    <a
                      href="https://maps.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-construction-orange hover:underline"
                    >
                      Check on Google Maps →
                    </a>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Tip: Open Google Maps, enter both addresses, and note the distance shown on the route.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===================== STEP 3: QUOTE ===================== */}
        {currentStep === 3 && pricing && (
          <div className="space-y-6">
            <PriceBreakdown pricing={pricing} />

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
                <CardDescription>Any specific requirements for the driver?</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-construction-orange"
                  rows={3}
                  placeholder="e.g. Call before arrival, delivery gate is on the left side..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {specialInstructions.length}/500 characters
                </p>
              </CardContent>
            </Card>

            {/* Overweight Acknowledgement */}
            {pricing.total_weight_kg > 2000 && (
              <Card className="border-yellow-400 bg-yellow-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="overweight"
                      checked={overweightAcknowledged}
                      onCheckedChange={(v) => setOverweightAcknowledged(v as boolean)}
                    />
                    <Label htmlFor="overweight" className="text-sm font-normal cursor-pointer text-yellow-900">
                      I acknowledge that this load ({(pricing.total_weight_kg / 1000).toFixed(2)} tonnes) 
                      exceeds the recommended vehicle capacity of 2 tonnes. I accept responsibility 
                      for any legal or safety implications of transporting an overweight load.
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ===================== STEP 4: SUCCESS ===================== */}
        {currentStep === 4 && (
          <Card>
            <CardContent className="py-16 text-center">
              <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Created!</h2>
              <p className="text-slate-600 mb-4">
                Your job has been submitted. Drivers will be notified shortly.
              </p>
              <p className="text-sm text-slate-500">Redirecting to your bookings...</p>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        {currentStep < 4 && (
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => { setError(''); setCurrentStep(s => Math.max(1, s - 1)); }}
              disabled={currentStep === 1 || calculatingPrice || submitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < 3 && (
              <Button
                className="bg-construction-orange hover:bg-construction-orange/90 text-white"
                onClick={handleNextStep}
                disabled={calculatingPrice}
              >
                {calculatingPrice ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Calculating...</>
                ) : (
                  <>Next <ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                className="bg-construction-orange hover:bg-construction-orange/90 text-white"
                onClick={handleSubmitJob}
                disabled={submitting || (pricing?.total_weight_kg > 2000 && !overweightAcknowledged)}
              >
                {submitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                ) : (
                  <>Confirm Booking <CheckCircle className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}