'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/services/auth.service';
import type { RegisterFormData, UserRole } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  profile: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: RegisterFormData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      await authService.signIn(email, password);
      await loadUser();
      
      // Redirect based on role
      if (user?.role === 'client') {
        router.push('/client/dashboard');
      } else if (user?.role === 'driver') {
        router.push('/driver/dashboard');
      } else if (user?.role === 'admin') {
        router.push('/admin/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signUp(data: RegisterFormData) {
    setLoading(true);
    try {
      await authService.signUp(data);
      await loadUser();
      
      // Redirect based on role
      if (data.role === 'client') {
        router.push('/client/dashboard');
      } else if (data.role === 'driver') {
        router.push('/driver/dashboard');
      }
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    await loadUser();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}