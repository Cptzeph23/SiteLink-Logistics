'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Truck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authService } from '@/lib/services/auth.service';
import type { RegisterFormData, UserRole } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get('role') as UserRole || 'client';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    phone: '',
    full_name: '',
    password: '',
    role: defaultRole,
    company_name: '',
    business_type: 'builder',
    license_number: '',
    license_expiry: '',
    id_number: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signUp(formData);
      
      // Redirect based on role
      if (formData.role === 'client') {
        router.push('/client/dashboard');
      } else if (formData.role === 'driver') {
        router.push('/driver/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Truck className="h-10 w-10 text-construction-orange" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">SiteLink Logistics</h1>
            <p className="text-sm text-slate-600">Linking materials to sites</p>
          </div>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join SiteLink to start transporting materials</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Role Selection */}
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client (Builder/Hardware Store)</SelectItem>
                    <SelectItem value="driver">Driver (LCV Operator)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="0712345678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <p className="text-xs text-slate-500">At least 8 characters</p>
              </div>

              {/* Client-specific fields */}
              {formData.role === 'client' && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4">Business Information (Optional)</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          placeholder="ABC Construction Ltd"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="business_type">Business Type</Label>
                        <Select
                          value={formData.business_type}
                          onValueChange={(value) => setFormData({ ...formData, business_type: value })}
                          disabled={loading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="builder">Builder/Contractor</SelectItem>
                            <SelectItem value="hardware_store">Hardware Store</SelectItem>
                            <SelectItem value="contractor">Construction Contractor</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Driver-specific fields */}
              {formData.role === 'driver' && (
                <>
                  <div className="pt-4 border-t">
                    <h3 className="font-semibold mb-4">Driver Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="license_number">Driver's License Number</Label>
                        <Input
                          id="license_number"
                          placeholder="DL123456"
                          value={formData.license_number}
                          onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="license_expiry">License Expiry Date</Label>
                        <Input
                          id="license_expiry"
                          type="date"
                          value={formData.license_expiry}
                          onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="id_number">ID Number</Label>
                        <Input
                          id="id_number"
                          placeholder="12345678"
                          value={formData.id_number}
                          onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-construction-orange hover:bg-construction-orange/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              <div className="text-center text-sm text-slate-600">
                Already have an account?{' '}
                <Link href="/login" className="text-construction-orange hover:underline font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}