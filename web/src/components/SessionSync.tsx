'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SessionSync() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('codice_session_channel');

    channel.onmessage = (event) => {
      if (event.data === 'logout') {
        // Clear auth cookies
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Redirect to login page
        router.push('/login');
      }
    };

    return () => {
      channel.close();
    };
  }, [router]);

  return null;
}
