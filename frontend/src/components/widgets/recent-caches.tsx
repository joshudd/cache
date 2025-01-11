import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Track } from "@/types";
import { getCaches, onCacheUpdate } from "@/lib/cache";

interface CachedTrack {
  id: string;
  track_title: string;
  artist: string;
  image_url: string | null;
  status: string;
  cached_at: string;
  last_listened: string;
}

export default function RecentCaches() {
  const [tracks, setTracks] = useState<CachedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaches = async () => {
    try {
      const data = await getCaches(5)
      setTracks(Array.isArray(data) ? data : data.results || [])
    } catch (error) {
      console.error('failed to fetch caches:', error)
      setTracks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaches()
    // subscribe to cache updates
    const unsubscribe = onCacheUpdate(fetchCaches)
    return () => unsubscribe()
  }, []);

  if (loading) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">recent caches</h3>
        <div className="text-sm text-muted-foreground">loading...</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <h3 className="text-sm font-medium mb-4">recent caches</h3>
        <div className="text-sm text-muted-foreground">no recent caches</div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4"> 
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <img
                src={track.image_url ?? "/placeholder-album.jpg"}
                alt={`${track.track_title} album art`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate text-sm">
                {track.track_title}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {track.artist}
              </div>
            </div>
            <div className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(new Date(track.cached_at), { addSuffix: true })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 