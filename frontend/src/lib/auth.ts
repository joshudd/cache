const API_URL = process.env.NEXT_PUBLIC_API_URL;

// types
export interface User {
  username: string;
  email: string;
  spotify_connected: boolean;
}

// csrf token management
export async function getCSRFToken(): Promise<string> {
  const response = await fetch(`${API_URL}/api/auth/csrf/`, {
    credentials: 'include',
  });
  const data = await response.json();
  return data.csrfToken;
}

// user auth
export async function login(username: string, password: string): Promise<User> {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  return data.user;
}

export async function logout(): Promise<void> {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/logout/`, {
    method: 'POST',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

export async function signup(username: string, password: string): Promise<User> {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/auth/signup/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Signup failed');
  }

  const data = await response.json();
  return data.user;
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch(`${API_URL}/api/auth/user/`, {
    credentials: 'include',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// spotify auth
export async function getSpotifyAuthUrl(): Promise<string> {
  const response = await fetch(`${API_URL}/api/spotify/auth-url/`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify auth URL');
  }

  const data = await response.json();
  return data.auth_url;
}

export async function connectSpotify(code: string, state: string): Promise<void> {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/spotify/callback/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    throw new Error('Failed to connect Spotify');
  }
}

export async function disconnectSpotify(): Promise<void> {
  const csrfToken = await getCSRFToken();
  
  const response = await fetch(`${API_URL}/api/spotify/disconnect/`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to disconnect Spotify');
  }
}

export async function getSpotifyConnectionStatus(): Promise<{ connected: boolean; expires_at?: string }> {
  const response = await fetch(`${API_URL}/api/spotify/status/`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to get Spotify connection status');
  }

  return response.json();
}
