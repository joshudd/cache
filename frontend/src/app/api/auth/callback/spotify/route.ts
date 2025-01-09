import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  
  if (!code) {
    return NextResponse.redirect(new URL('/dashboard?error=spotify_auth_failed', request.url));
  }

  try {
    // Get cookie store and format cookies
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map(cookie => `${cookie.name}=${cookie.value}`)
      .join('; ');

    // Get CSRF token first
    const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf/`, {
      credentials: 'include',
      headers: {
        Cookie: cookieHeader,
      },
    });
    const { csrfToken } = await csrfResponse.json();

    // call our backend to handle the spotify callback
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/callback/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader,
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ code, state }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Spotify callback failed:', await response.text());
      throw new Error('Failed to connect Spotify');
    }

    return NextResponse.redirect(new URL('/account/profile?success=true', request.url));
  } catch (error) {
    console.error('Error in Spotify callback:', error);
    return NextResponse.redirect(new URL('/dashboard?error=spotify_auth_failed', request.url));
  }
}
