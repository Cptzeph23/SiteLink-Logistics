'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingPage } from '@/components/shared/LoadingSpinner';

// /driver/jobs redirects to the dashboard which already shows available jobs
// The dashboard has the "Available Jobs" and "My Jobs" tabs built in
export default function DriverJobsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/driver/dashboard');
  }, []);

  return <LoadingPage />;
}