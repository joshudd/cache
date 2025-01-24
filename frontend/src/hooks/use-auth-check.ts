'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCookie } from '@/lib/cookies';

// client side auth check to replace middleware
export function useAuthCheck() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = getCookie('sessionid');
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [router]);
} 