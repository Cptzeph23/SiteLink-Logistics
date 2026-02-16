'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, Menu, X, LogOut, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  userRole: 'client' | 'driver' | 'admin';
  userName?: string;
  onLogout: () => void;
}

function getNavLinks(role: string) {
  switch (role) {
    case 'client': return [
      { href: '/client/dashboard',    label: 'Dashboard' },
      { href: '/client/bookings/new', label: 'New Booking' },
      { href: '/client/bookings',     label: 'My Bookings' },
    ];
    case 'driver': return [
      { href: '/driver/dashboard', label: 'Dashboard' },
      { href: '/driver/dashboard', label: 'Available Jobs' },
      { href: '/driver/earnings',  label: 'Earnings' },
    ];
    case 'admin': return [
      { href: '/admin/dashboard', label: 'Dashboard' },
      { href: '/admin/jobs',      label: 'All Jobs' },
      { href: '/admin/users',     label: 'Users' },
    ];
    default: return [];
  }
}

const ROLE_COLORS: Record<string, string> = {
  client: 'bg-emerald-100 text-emerald-700',
  driver: 'bg-blue-100 text-blue-700',
  admin:  'bg-violet-100 text-violet-700',
};

export function Navbar({ userRole, userName, onLogout }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const links = getNavLinks(userRole);
  const initials = userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) : '?';

  return (
    <nav className="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--orange)' }}>
              <Truck className="h-4.5 w-4.5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 text-base leading-none"
                style={{ fontFamily: 'Syne, sans-serif' }}>
                SiteLink
              </span>
              <span className="block text-xs text-slate-400 leading-none mt-0.5">Logistics</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(link => {
              const isActive = pathname === link.href ||
                (link.href !== '/client/dashboard' && link.href !== '/driver/dashboard' &&
                 link.href !== '/admin/dashboard' && pathname.startsWith(link.href));
              return (
                <Link key={link.href + link.label} href={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  style={isActive ? { background: 'var(--orange)' } : {}}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right: User + Logout */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'var(--orange)' }}>
                {initials}
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 leading-tight">{userName || 'User'}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${ROLE_COLORS[userRole]}`}>
                  {userRole}
                </span>
              </div>
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600
                         px-3 py-2 rounded-lg hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-1 animate-fade-in">
          {links.map(link => (
            <Link key={link.href + link.label} href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${pathname === link.href
                  ? 'text-white'
                  : 'text-slate-700 hover:bg-slate-100'}`}
              style={pathname === link.href ? { background: 'var(--orange)' } : {}}>
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t mt-3">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: 'var(--orange)' }}>
                {initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{userName}</p>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${ROLE_COLORS[userRole]}`}>
                  {userRole}
                </span>
              </div>
            </div>
            <button onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}