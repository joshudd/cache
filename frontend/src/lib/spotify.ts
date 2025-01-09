const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function searchTracks(query: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/search?q=${query}`);
  if (!response.ok) throw new Error('Failed to search tracks');
  return response.json();
}

export async function connectSpotify() {
  // get auth url from backend
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/auth/`);
  const { auth_url } = await response.json();
  
  // save current page url to return after auth
  sessionStorage.setItem('spotify_redirect', window.location.href);
  
  // redirect to spotify login
  window.location.href = auth_url;
}

export async function getUserPlaylists() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/playlists/`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to fetch playlists');
  return response.json();
}

export async function getUniqueRecommendations() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/recommendations/unique/`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

export async function disconnectSpotify() {
  const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf/`, {
    credentials: 'include',
  });
  const { csrfToken } = await csrfResponse.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/disconnect/`,
    {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'X-CSRFToken': csrfToken,
      },
    }
  );
  if (!response.ok) throw new Error('Failed to disconnect Spotify');
}

export async function getSpotifyStatus() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/status/`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to get Spotify status');
  return response.json();
}
