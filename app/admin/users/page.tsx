'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/Navbar';
import { LoadingPage } from '@/components/shared/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft, CheckCircle, XCircle, ShieldCheck, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { authService } from '@/lib/services/auth.service';

export default function AdminUsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'client' | 'driver'>('all');
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function init() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') { router.push('/login'); return; }
        setUser(currentUser);
        await loadUsers();
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    }
    init();
  }, []);

  useEffect(() => {
    setFiltered(filter === 'all' ? users : users.filter(u => u.role === filter));
  }, [filter, users]);

  async function loadUsers() {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
    setFiltered(data.users || []);
  }

  async function handleAction(userId: string, action: string) {
    setUpdating(userId + action);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setTimeout(() => setMessage(''), 3000);
      await loadUsers();
    } catch (err: any) {
      setMessage(err.message || 'Action failed');
    } finally {
      setUpdating(null);
    }
  }

  if (loading) return <LoadingPage />;

  const counts = {
    all:    users.length,
    client: users.filter(u => u.role === 'client').length,
    driver: users.filter(u => u.role === 'driver').length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userRole="admin"
        userName={user?.full_name}
        onLogout={async () => { await authService.signOut(); router.push('/'); }}
      />
      <div className="container mx-auto px-4 py-8">
        <Link href="/admin/dashboard">
          <Button variant="ghost" className="mb-6 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">All Users</h1>
          <span className="text-slate-500">{filtered.length} users</span>
        </div>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 text-sm">
            {message}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'client', 'driver'] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilter(role)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors
                ${filter === role
                  ? 'bg-construction-orange text-white'
                  : 'bg-white border text-slate-600 hover:bg-slate-50'}`}
            >
              {role} <span className={`ml-1 text-xs ${filter === role ? 'opacity-70' : 'text-slate-400'}`}>
                ({counts[role]})
              </span>
            </button>
          ))}
        </div>

        {/* Users List */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No users found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((u: any) => {
              const isClient = u.role === 'client';
              const isDriver = u.role === 'driver';
              const profile  = isClient ? u.client_profile : u.driver_profile;
              const isVerifiedDriver = isDriver && profile?.is_verified;

              return (
                <Card key={u.id} className={`border-l-4 ${
                  !u.is_active ? 'border-l-red-300 opacity-70' :
                  isDriver     ? 'border-l-blue-400' :
                                 'border-l-green-400'
                }`}>
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1">
                        {/* Name, role, status */}
                        <div className="flex items-center gap-3 flex-wrap mb-2">
                          <span className="font-semibold text-slate-800">{u.full_name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium
                            ${isDriver ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {u.role}
                          </span>
                          {!u.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Deactivated
                            </span>
                          )}
                          {isDriver && isVerifiedDriver && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </span>
                          )}
                        </div>

                        {/* Contact */}
                        <p className="text-sm text-slate-500">{u.email}</p>
                        {u.phone && <p className="text-sm text-slate-500">{u.phone}</p>}

                        {/* Profile details */}
                        {isClient && profile && (
                          <p className="text-xs text-slate-400 mt-1">
                            {profile.company_name || 'No company'} · {profile.business_type || 'No type'}
                          </p>
                        )}
                        {isDriver && profile && (
                          <p className="text-xs text-slate-400 mt-1">
                            License: {profile.license_number} · Expiry: {profile.license_expiry}
                          </p>
                        )}

                        <p className="text-xs text-slate-400 mt-1">
                          Joined {new Date(u.created_at).toLocaleDateString('en-KE')}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 items-end justify-center">
                        {/* Activate / Deactivate */}
                        <Button
                          size="sm"
                          variant="outline"
                          className={u.is_active
                            ? 'border-red-300 text-red-600 hover:bg-red-50'
                            : 'border-green-400 text-green-700 hover:bg-green-50'}
                          onClick={() => handleAction(u.id, 'toggle_active')}
                          disabled={updating === u.id + 'toggle_active'}
                        >
                          {updating === u.id + 'toggle_active'
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : u.is_active
                              ? <><XCircle className="h-3 w-3 mr-1" /> Deactivate</>
                              : <><CheckCircle className="h-3 w-3 mr-1" /> Activate</>
                          }
                        </Button>

                        {/* Verify Driver */}
                        {isDriver && !isVerifiedDriver && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                            onClick={() => handleAction(u.id, 'verify_driver')}
                            disabled={updating === u.id + 'verify_driver'}
                          >
                            {updating === u.id + 'verify_driver'
                              ? <Loader2 className="h-3 w-3 animate-spin" />
                              : <><ShieldCheck className="h-3 w-3 mr-1" /> Verify Driver</>
                            }
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}