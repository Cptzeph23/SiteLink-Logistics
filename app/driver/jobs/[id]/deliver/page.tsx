'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, CheckCircle, ArrowLeft, X } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';

export default function DeliveryConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        
        // Verify driver is assigned to this job
        if (data.job.driver_id !== currentUser.id) {
          alert('You are not assigned to this job');
          router.push('/driver/dashboard');
          return;
        }
        
        if (data.job.status !== 'in_transit') {
          alert('Job must be in transit to mark as delivered');
          router.push(`/driver/jobs/${jobId}`);
          return;
        }

        setJob(data.job);
      } catch (err: any) {
        alert(err.message || 'Failed to load job');
        router.push('/driver/dashboard');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [jobId]);

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoBase64(base64);
      setPhotoPreview(base64);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto() {
    setPhotoBase64(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!recipientName.trim()) {
      alert('Recipient name is required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/proof-of-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim() || null,
          notes: notes.trim() || null,
          photo_base64: photoBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Success - redirect to job detail with success message
      router.push(`/driver/jobs/${jobId}?delivered=true`);

    } catch (err: any) {
      alert(err.message || 'Failed to confirm delivery');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingPage />;
  if (!job) return null;

  const delivery = job.job_stops?.find((s: any) => s.stop_type === 'delivery');

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
            Delivery Confirmation
          </p>
          <h1 className="text-3xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Confirm Delivery
          </h1>
          <p className="text-slate-500 text-sm mt-1">{job.job_number}</p>
        </div>

        {/* Delivery Address */}
        <div className="mb-6 p-4 bg-white border border-slate-100 rounded-xl animate-fade-up"
          style={{ animationDelay: '0.1s' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
            Delivery Address
          </p>
          <p className="text-slate-800 font-medium">{delivery?.address}</p>
          {delivery?.contact_name && (
            <p className="text-slate-500 text-sm mt-1">
              Contact: {delivery.contact_name}
              {delivery.contact_phone && ` · ${delivery.contact_phone}`}
            </p>
          )}
        </div>

        {/* PoD Form */}
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-up"
          style={{ animationDelay: '0.2s' }}>

          {/* Recipient Name */}
          <div>
            <Label htmlFor="recipient_name" className="text-sm font-semibold text-slate-700 mb-2 block">
              Recipient Name *
            </Label>
            <Input
              id="recipient_name"
              placeholder="Who received the delivery?"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              required
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
            <p className="text-xs text-slate-400 mt-1">Person who accepted the materials</p>
          </div>

          {/* Recipient Phone (Optional) */}
          <div>
            <Label htmlFor="recipient_phone" className="text-sm font-semibold text-slate-700 mb-2 block">
              Recipient Phone <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="recipient_phone"
              type="tel"
              placeholder="0712345678"
              value={recipientPhone}
              onChange={e => setRecipientPhone(e.target.value)}
              disabled={submitting}
              className="h-12 rounded-xl border-slate-200 bg-white"
            />
          </div>

          {/* Photo Upload */}
          <div>
            <Label className="text-sm font-semibold text-slate-700 mb-2 block">
              Delivery Photo <span className="text-slate-400 font-normal">(optional but recommended)</span>
            </Label>
            
            {!photoPreview ? (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                <Camera className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-3">Take a photo of the delivered materials</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={submitting}
                >
                  <Camera className="h-4 w-4 mr-2" /> Choose Photo
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoCapture}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={photoPreview}
                  alt="Delivery photo"
                  className="w-full h-64 object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={submitting}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              Max 5MB · JPG, PNG · Photo helps verify successful delivery
            </p>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-semibold text-slate-700 mb-2 block">
              Notes <span className="text-slate-400 font-normal">(optional)</span>
            </Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any additional notes about the delivery..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm resize-none focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-colors"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={submitting || !recipientName.trim()}
            className="w-full h-12 text-base font-semibold rounded-xl transition-all hover:-translate-y-0.5"
            style={{
              background: submitting || !recipientName.trim() ? '#CBD5E0' : '#10B981',
              color: 'white',
              boxShadow: submitting || !recipientName.trim() ? 'none' : '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Confirming Delivery...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Confirm Delivery
              </>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400 mt-4">
            By confirming, you certify that materials were delivered successfully
          </p>
        </form>
      </div>
    </div>
  );
}