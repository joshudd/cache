const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

export async function searchTracks(query: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/search?q=${query}`,
    {
      credentials: 'include',
    }
  );
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

export async function getRecentlyPlayed() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/recently-played/`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('failed to fetch recently played tracks');
  return response.json();
}

export async function getBuriedRecommendations() {
  const res = await fetch('/api/spotify/buried-recommendations')
  if (!res.ok) throw new Error('failed to fetch buried recommendations')
  return res.json()
}

export async function getPlaylistSettings() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/playlist-settings/`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to get playlist settings');
  }
  return response.json();
}

export async function updatePlaylistSettings(playlistId: string, playlistName: string) {
  const csrfResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/csrf/`, {
    credentials: 'include',
  });
  const { csrfToken } = await csrfResponse.json();

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/spotify/playlist-settings/`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({ playlist_id: playlistId, playlist_name: playlistName }),
    }
  );
  if (!response.ok) {
    throw new Error('Failed to update playlist settings');
  }
  return response.json();
}
