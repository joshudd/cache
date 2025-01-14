// track api functions
import { Track } from "@/types"

// get csrf token from cookie
function getCsrfToken() {
    const name = 'csrftoken='
    const decodedCookie = decodeURIComponent(document.cookie)
    const cookieArray = decodedCookie.split(';')
    for (let cookie of cookieArray) {
        cookie = cookie.trim()
        if (cookie.indexOf(name) === 0) {
            return cookie.substring(name.length, cookie.length)
        }
    }
    return ''
}

// simple event emitter for track updates
const trackUpdateListeners: (() => void)[] = []

export function onTrackUpdate(listener: () => void) {
    trackUpdateListeners.push(listener)
    return () => {
        const index = trackUpdateListeners.indexOf(listener)
        if (index > -1) trackUpdateListeners.splice(index, 1)
    }
}

export function notifyTrackUpdate() {
    trackUpdateListeners.forEach(listener => listener())
}

export async function getTracks(limit: number = 5, status?: string) {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks`);
    url.searchParams.append('limit', limit.toString());
    if (status) url.searchParams.append('status', status);
    
    const response = await fetch(url.toString(), { credentials: 'include' });
    if (!response.ok) throw new Error('Failed to fetch tracks');
    return response.json();
}

export async function createTrack(data: {
    spotify_id: string;
    title: string;
    artist: string;
    album: string;
    preview_url?: string | null;
    image_url: string;
    release_date?: string;
}) {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
        },
        credentials: 'include',
        body: JSON.stringify(data)
    });

    if (response.status === 400) {
        const error = await response.json();
        console.error('Track creation error:', error); // debug log
        
        // handle array error format
        if (Array.isArray(error)) {
            throw new Error(error[0]);
        }
        
        // handle object error format
        if (error.detail?.includes('already exists')) {
            throw new Error('track already exists in your vault');
        }
        if (error.detail) {
            throw new Error(error.detail);
        }
        
        throw new Error('failed to create track: ' + JSON.stringify(error));
    }

    notifyTrackUpdate();
    return response.json();
}

export async function getAllTracks() {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/`,
        { credentials: 'include' }
    )
    
    if (!response.ok) throw new Error('Failed to fetch tracks');
    return response.json();
}

export async function deleteTrack(id: number) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}`, 
        {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
            credentials: 'include'
        }
    );
    
    if (!response.ok) throw new Error('Failed to delete track');
    notifyTrackUpdate();
}

export async function lockTrack(id: number) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}/lock/`, 
        {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
            credentials: 'include'
        }
    );
    
    if (!response.ok) throw new Error('Failed to lock track');
    notifyTrackUpdate();
    return response.json();
}

export async function revealTrack(id: number) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${id}/reveal/`, 
        {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
            credentials: 'include'
        }
    );
    
    if (!response.ok) throw new Error('Failed to reveal track');
    notifyTrackUpdate();
    return response.json();
}

export async function checkTracksStatus(trackIds: string[]) {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/check?spotify_ids=${trackIds.join(',')}`,
        { credentials: 'include' }
    );
    
    if (!response.ok) throw new Error('failed to check track status');
    return response.json();
}
  