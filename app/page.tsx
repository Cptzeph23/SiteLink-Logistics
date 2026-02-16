import Link from 'next/link';
import { Truck, Package, MapPin, Shield, ChevronRight, Star, Zap, Clock } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── Top Nav ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--orange)' }}>
              <Truck className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>
              SiteLink <span className="font-normal text-slate-400">Logistics</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors">
              Sign In
            </Link>
            <Link href="/register"
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5"
              style={{ background: 'var(--orange)', boxShadow: '0 2px 8px rgba(255,107,53,0.35)' }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="hero-gradient py-24 px-4">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-white/90
            text-xs font-semibold px-4 py-1.5 rounded-full mb-8 border border-white/20 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Nairobi's Construction Logistics Platform
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-6 leading-tight animate-fade-up"
            style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.03em' }}>
            Move Materials.
            <br />
            <span style={{ color: 'var(--orange)' }}>Build Faster.</span>
          </h1>

          <p className="text-lg text-white/70 max-w-xl mx-auto mb-10 animate-fade-up"
            style={{ animationDelay: '0.1s' }}>
            Connect with verified LCV drivers to transport construction materials
            from hardware stores to your site — with real-time tracking and transparent pricing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up stagger-children"
            style={{ animationDelay: '0.2s' }}>
            <Link href="/register?role=client"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold
                px-7 py-3.5 rounded-xl text-base transition-all hover:-translate-y-1"
              style={{ background: 'var(--orange)', boxShadow: '0 4px 20px rgba(255,107,53,0.45)' }}>
              <Package className="h-5 w-5" /> Book a Transport
            </Link>
            <Link href="/register?role=driver"
              className="inline-flex items-center justify-center gap-2 font-semibold
                px-7 py-3.5 rounded-xl text-base border-2 border-white/30 text-white
                hover:bg-white/10 transition-all">
              <Truck className="h-5 w-5" /> Drive With Us
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto mt-16 animate-fade-up"
            style={{ animationDelay: '0.3s' }}>
            {[
              { value: '2T',  label: 'Max Payload' },
              { value: '24h', label: 'Availability' },
              { value: '20%', label: 'Platform Cut' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-extrabold text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {s.value}
                </p>
                <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--orange)' }}>Why SiteLink</p>
            <h2 className="text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Built for Kenya's Construction Industry
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Package,
                color: 'bg-orange-100 text-orange-600',
                title: 'Weight-Aware Booking',
                desc: 'Select materials by category, get real-time weight calculations and automatic overload warnings before confirming.',
              },
              {
                icon: MapPin,
                color: 'bg-blue-100 text-blue-600',
                title: 'Live GPS Tracking',
                desc: 'Track your driver on a live map from pickup to delivery. No more "where is my order?" calls.',
              },
              {
                icon: Shield,
                color: 'bg-emerald-100 text-emerald-600',
                title: 'Transparent Pricing',
                desc: 'Know your cost before you book. Base fee + distance + handling, with full breakdown shown upfront.',
              },
              {
                icon: Zap,
                color: 'bg-yellow-100 text-yellow-600',
                title: 'Instant Matching',
                desc: 'Your job is broadcast to all available verified drivers the moment you confirm. Fast pickup guaranteed.',
              },
              {
                icon: Clock,
                color: 'bg-violet-100 text-violet-600',
                title: 'M-Pesa on Delivery',
                desc: 'No upfront payment. Pay via M-Pesa only when your materials arrive safely at the site.',
              },
              {
                icon: Star,
                color: 'bg-pink-100 text-pink-600',
                title: 'Verified Drivers',
                desc: 'All drivers are vetted with valid licenses and verified by our admin team before going live.',
              },
            ].map(f => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 bg-white card-hover">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                  {f.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--orange)' }}>Process</p>
            <h2 className="text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              Book in 4 Simple Steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Select Materials',  desc: 'Pick from 40+ materials. Quantities auto-calculate weight.' },
              { step: '02', title: 'Enter Locations',   desc: 'Pickup hardware store, delivery to your site address.' },
              { step: '03', title: 'Get Your Quote',    desc: 'Instant price based on distance and materials.' },
              { step: '04', title: 'Track & Receive',   desc: 'Driver accepts, you track live. Pay on delivery.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 h-full">
                  <p className="text-4xl font-extrabold mb-4 leading-none"
                    style={{ fontFamily: 'Syne, sans-serif', color: 'var(--orange)', opacity: 0.25 }}>
                    {s.step}
                  </p>
                  <h3 className="font-bold text-slate-900 mb-2 text-sm"
                    style={{ fontFamily: 'Syne, sans-serif' }}>
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-2 z-10 -translate-y-1/2">
                    <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center bg-white"
                      style={{ borderColor: 'var(--orange)' }}>
                      <ChevronRight className="h-2.5 w-2.5" style={{ color: 'var(--orange)' }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-slate-900 mb-4"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            Ready to Get Started?
          </h2>
          <p className="text-slate-500 mb-8">
            Join clients and drivers already using SiteLink across Nairobi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=client"
              className="inline-flex items-center justify-center gap-2 text-white font-semibold
                px-8 py-3.5 rounded-xl text-base transition-all hover:-translate-y-1"
              style={{ background: 'var(--orange)', boxShadow: '0 4px 20px rgba(255,107,53,0.4)' }}>
              <Package className="h-5 w-5" /> I Need Materials Moved
            </Link>
            <Link href="/register?role=driver"
              className="inline-flex items-center justify-center gap-2 font-semibold text-slate-700
                px-8 py-3.5 rounded-xl text-base border-2 border-slate-200 hover:border-slate-300 transition-all">
              <Truck className="h-5 w-5" /> I'm a Driver
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t py-8 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{ background: 'var(--orange)' }}>
              <Truck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-700 text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
              SiteLink Logistics
            </span>
          </div>
          <p className="text-xs text-slate-400">© 2025 SiteLink Logistics. Nairobi, Kenya.</p>
          <div className="flex gap-4 text-xs text-slate-400">
            <Link href="/login" className="hover:text-slate-600 transition-colors">Login</Link>
            <Link href="/register" className="hover:text-slate-600 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}