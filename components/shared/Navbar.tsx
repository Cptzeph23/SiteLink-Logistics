'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Truck, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavbarProps {
  userRole: 'client' | 'driver' | 'admin';
  userName?: string;
  onLogout?: () => void;
}

export function Navbar({ userRole, userName, onLogout }: NavbarProps) {
  const pathname = usePathname();

  const getNavLinks = () => {
    switch (userRole) {
      case 'client':
        return [
          { href: '/client/dashboard', label: 'Dashboard' },
          { href: '/client/bookings/new', label: 'New Booking' },
          { href: '/client/bookings', label: 'My Bookings' },
        ];
      case 'driver':
        return [
          { href: '/driver/dashboard', label: 'Dashboard' },
          { href: '/driver/dashboard', label: 'Available Jobs' },
          { href: '/driver/earnings', label: 'Earnings' },
        ];
      case 'admin':
        return [
          { href: '/admin/dashboard', label: 'Dashboard' },
          { href: '/admin/jobs', label: 'All Jobs' },
          { href: '/admin/users', label: 'Users' },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href={`/${userRole}/dashboard`} className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-construction-orange" />
            <div>
              <h1 className="text-xl font-bold text-slate-900">SiteLink Logistics</h1>
              <p className="text-xs text-slate-600 capitalize">{userRole} Portal</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-construction-orange',
                  pathname === link.href
                    ? 'text-construction-orange'
                    : 'text-slate-600'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-600" />
              <span className="text-slate-700">{userName || 'User'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="text-slate-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4 flex gap-4 overflow-x-auto pb-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium whitespace-nowrap px-3 py-2 rounded-md transition-colors',
                pathname === link.href
                  ? 'bg-construction-orange text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}