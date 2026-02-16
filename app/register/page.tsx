'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, Loader2, Eye, EyeOff, User, Building2, Car } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') || 'client';

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [formData, setFormData] = useState({
    email: '', phone: '', full_name: '', password: '',
    role: defaultRole, company_name: '', business_type: 'builder',
    license_number: '', license_expiry: '', id_number: '',
  });

  function update(field: string, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      router.push(data.redirect || '/login');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const isDriver = formData.role === 'driver';
  const isClient = formData.role === 'client';

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>

      {/* ── Left Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex w-[42%] hero-gradient flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            SiteLink
          </span>
        </Link>

        <div>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Join Nairobi's<br />
            <span style={{ color: 'var(--orange)' }}>construction network.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-10 max-w-xs">
            Whether you're moving materials to a site or looking to earn as a driver — SiteLink connects you.
          </p>

          {/* Role cards */}
          <div className="space-y-3">
            {[
              { icon: Building2, role: 'Client', desc: 'Book trusted drivers to move your construction materials.' },
              { icon: Car,       role: 'Driver', desc: 'Earn by transporting materials across Nairobi.' },
            ].map(item => (
              <div key={item.role}
                className="flex items-start gap-3 bg-white/8 backdrop-blur rounded-xl p-4 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{item.role}</p>
                  <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/25 text-xs">© 2025 SiteLink Logistics · Nairobi</p>
      </div>

      {/* ── Right Panel ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--orange)' }}>
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              SiteLink
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Create account
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Already have one?{' '}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: 'var(--orange)' }}>
              Sign in
            </Link>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* ── Role Selector ──────────────────────── */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-slate-700">I am a</Label>
              <Select value={formData.role} onValueChange={v => update('role', v)} disabled={loading}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="client">Client — Builder / Hardware Store</SelectItem>
                  <SelectItem value="driver">Driver — LCV Operator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ── Basic Info ─────────────────────────── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name" className="text-sm font-medium text-slate-700">Full Name *</Label>
                <Input id="full_name" placeholder="Jane Doe"
                  value={formData.full_name} onChange={e => update('full_name', e.target.value)}
                  required disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone *</Label>
                <Input id="phone" placeholder="0712345678"
                  value={formData.phone} onChange={e => update('phone', e.target.value)}
                  required disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email *</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={formData.email} onChange={e => update('email', e.target.value)}
                required disabled={loading}
                className="h-11 rounded-xl border-slate-200 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password *</Label>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={formData.password} onChange={e => update('password', e.target.value)}
                  required disabled={loading} minLength={8}
                  className="h-11 rounded-xl border-slate-200 bg-white pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* ── Client Section ─────────────────────── */}
            {isClient && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Business Info <span className="normal-case font-normal text-slate-400">(optional)</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="company_name" className="text-sm font-medium text-slate-700">
                      Company Name
                    </Label>
                    <Input id="company_name" placeholder="ABC Construction"
                      value={formData.company_name} onChange={e => update('company_name', e.target.value)}
                      disabled={loading} className="h-11 rounded-xl border-slate-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Business Type</Label>
                    <Select value={formData.business_type}
                      onValueChange={v => update('business_type', v)} disabled={loading}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="builder">Builder / Contractor</SelectItem>
                        <SelectItem value="hardware_store">Hardware Store</SelectItem>
                        <SelectItem value="contractor">Construction Contractor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ── Driver Section ─────────────────────── */}
            {isDriver && (
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Driver Details *
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="license_number" className="text-sm font-medium text-slate-700">
                      License No. *
                    </Label>
                    <Input id="license_number" placeholder="DL123456"
                      value={formData.license_number} onChange={e => update('license_number', e.target.value)}
                      required disabled={loading} className="h-11 rounded-xl border-slate-200 bg-white" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="license_expiry" className="text-sm font-medium text-slate-700">
                      Expiry Date *
                    </Label>
                    <Input id="license_expiry" type="date"
                      value={formData.license_expiry} onChange={e => update('license_expiry', e.target.value)}
                      required disabled={loading} className="h-11 rounded-xl border-slate-200 bg-white" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="id_number" className="text-sm font-medium text-slate-700">
                    National ID Number *
                  </Label>
                  <Input id="id_number" placeholder="12345678"
                    value={formData.id_number} onChange={e => update('id_number', e.target.value)}
                    required disabled={loading} className="h-11 rounded-xl border-slate-200 bg-white" />
                </div>
              </div>
            )}

            {/* ── Submit ─────────────────────────────── */}
            <button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white text-sm
                transition-all hover:-translate-y-0.5 active:translate-y-0
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
                flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading ? '#CBD5E0' : 'var(--orange)',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(255,107,53,0.4)',
              }}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</>
                : `Create ${isDriver ? 'Driver' : 'Client'} Account`}
            </button>

          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}