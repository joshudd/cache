// cache api functions
import { getCSRFToken } from './auth';

// simple event emitter for cache updates
const cacheUpdateListeners: (() => void)[] = []

export function onCacheUpdate(listener: () => void) {
  cacheUpdateListeners.push(listener)
  return () => {
    const index = cacheUpdateListeners.indexOf(listener)
    if (index > -1) cacheUpdateListeners.splice(index, 1)
  }
}

export function notifyCacheUpdate() {
  cacheUpdateListeners.forEach(listener => listener())
}

export async function getCaches(limit: number = 5) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/cache?limit=${limit}`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch caches');
  return response.json();
}

export async function createCache(data: {
  spotify_id: string;
  title: string;
  artist: string;
  album?: string;
  preview_url?: string;
  image_url?: string;
  notes?: string;
  status?: 'buried' | 'discovered' | 'favorite';
}) {
  const csrfToken = await getCSRFToken();
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cache`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    // handle duplicate cache error
    const errorText = await response.text();
    if (response.status === 500 && errorText.includes('UNIQUE constraint failed')) {
      throw new Error('track already exists in your cache');
    }
    throw new Error('failed to create cache');
  }

  notifyCacheUpdate();
  return response.json();
}

export async function getAllCaches() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/cache`,
    {
      credentials: 'include',
    }
  );
  if (!response.ok) throw new Error('Failed to fetch caches');
  return response.json();
}

export async function deleteCache(id: number) {
  // get csrf token
  const csrfToken = await getCSRFToken();

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cache/${id}`, {
    method: 'DELETE',
    headers: {
      'X-CSRFToken': csrfToken,
    },
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to delete cache');
  return true;
} 

export async function checkCachedTracks(trackIds: string[]) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/cache/check?ids=${trackIds.join(',')}`,
      {
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error('failed to check cached tracks');
    return response.json();
  }
  