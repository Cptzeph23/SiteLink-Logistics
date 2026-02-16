'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Truck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/lib/services/auth.service';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  function update(f: string, v: string) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.signIn(form.email, form.password);
      const user = await authService.getCurrentUser();
      if (!user) { setError('Could not load your profile. Please try again.'); setLoading(false); return; }
      if (user.role === 'client') router.push('/client/dashboard');
      else if (user.role === 'driver') router.push('/driver/dashboard');
      else if (user.role === 'admin') router.push('/admin/dashboard');
      else router.push('/client/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex w-[45%] hero-gradient flex-col justify-between p-12 relative">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/15 backdrop-blur">
            <Truck className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-white text-xl" style={{ fontFamily: 'Syne, sans-serif' }}>
            SiteLink
          </span>
        </Link>

        <div className="relative z-10">
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Your materials,<br />
            <span style={{ color: 'var(--orange)' }}>delivered right.</span>
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Real-time tracking, transparent pricing, and verified drivers — all in one platform.
          </p>

          <div className="mt-10 space-y-4">
            {[
              { icon: '📍', text: 'Live GPS tracking on every delivery' },
              { icon: '💰', text: 'Know your price before you book' },
              { icon: '✅', text: 'Verified, insured LCV operators' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-lg">{item.icon}</span>
                <span className="text-white/70 text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/30 text-xs">© 2025 SiteLink Logistics · Nairobi</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--orange)' }}>
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              SiteLink
            </span>
          </Link>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}>Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your account to continue.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => update('email', e.target.value)}
                required disabled={loading}
                className="h-11 rounded-xl border-slate-200 bg-white" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password} onChange={e => update('password', e.target.value)}
                  required disabled={loading}
                  className="h-11 rounded-xl border-slate-200 bg-white pr-10" />
                <button type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full h-11 rounded-xl font-semibold text-white text-sm
                transition-all hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
              style={{ background: loading ? '#ccc' : 'var(--orange)',
                       boxShadow: loading ? 'none' : '0 4px 16px rgba(255,107,53,0.35)' }}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
                : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold hover:underline"
              style={{ color: 'var(--orange)' }}>
              Create one
            </Link>
          </p>

          <div className="mt-8 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}