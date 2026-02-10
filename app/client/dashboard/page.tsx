'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TruckIcon, MapPin } from 'lucide-react';
import { authService } from '@/lib/services/auth.service';
import Link from 'next/link';

export default function ClientDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'client') {
        router.push('/login');
        return;
      }
      setUser(currentUser);
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await authService.signOut();
    router.push('/');
  }

  if (loading) {
    return <LoadingPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar 
        userRole="client" 
        userName={user?.full_name} 
        onLogout={handleLogout}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-slate-600 mt-2">
            Manage your construction material deliveries
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-construction-orange border-2">
            <CardHeader>
              <Package className="h-8 w-8 text-construction-orange mb-2" />
              <CardTitle>New Booking</CardTitle>
              <CardDescription>
                Book a transport for your materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/bookings/new">
                <Button className="w-full bg-construction-orange hover:bg-construction-orange/90">
                  Create Booking
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <TruckIcon className="h-8 w-8 text-slate-600 mb-2" />
              <CardTitle>My Bookings</CardTitle>
              <CardDescription>
                View and track your deliveries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/client/bookings">
                <Button variant="outline" className="w-full">
                  View Bookings
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-slate-600 mb-2" />
              <CardTitle>Live Tracking</CardTitle>
              <CardDescription>
                Track active deliveries in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest bookings and deliveries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-slate-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p>No bookings yet</p>
              <p className="text-sm mt-2">Create your first booking to get started</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}