'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// inner component that uses search params
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code) {
        router.push('/dashboard?error=spotify_auth_failed');
        return;
      }

      try {
        // get csrf token
        const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf/`, {
          credentials: 'include',
        });
        const { csrfToken } = await csrfResponse.json();

        // call backend to handle spotify callback
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/callback/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          body: JSON.stringify({ code, state }),
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to connect Spotify');
        }

        router.push('/account?success=true');
      } catch (error) {
        console.error('Error in Spotify callback:', error);
        router.push('/dashboard?error=spotify_auth_failed');
      }
    }

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connecting to Spotify...</h1>
        <p className="text-muted-foreground">Please wait while we complete the connection.</p>
      </div>
    </div>
  );
}

// wrap in suspense boundary for static export
export default function SpotifyCallback() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Initializing Spotify connection...</p>
        </div>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
} 