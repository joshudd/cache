import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Track } from "@/types";
import { getCaches, onCacheUpdate } from "@/lib/cache";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

interface CachedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  image_url: string | null;
  status: 'buried' | 'discovered' | 'favorite';
  release_date?: string;
  cached_at: string;
  last_listened: string;
}

export default function RecentCaches() {
  const [tracks, setTracks] = useState<CachedTrack[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCaches = async () => {
    try {
      const data = await getCaches(5);
      setTracks(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error("failed to fetch caches:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaches();
    // subscribe to cache updates
    const unsubscribe = onCacheUpdate(fetchCaches);
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <div className="text-sm text-muted-foreground">no recent caches</div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4 animate-in fade-in duration-500">
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <img
                src={track.image_url ?? "/placeholder-album.jpg"}
                alt={`${track.title} album art`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm text-white/90 truncate">
                {track.title}
              </div>
              <div className="text-xs text-white/70 truncate mt-0.5">
                {track.artist}
              </div>
              <div className="text-xs text-white/40 truncate mt-0.5">
                {track.album}
                {track.release_date && (
                  <span className="text-white/30"> • {track.release_date.split('-')[0]}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(track.cached_at), {
                  addSuffix: true,
                })}
              </div>
              {track.status === 'discovered' && (
                <div className="text-xs font-medium text-purple-500/90">discovered</div>
              )}
              {track.status === 'favorite' && (
                <div className="text-xs font-medium text-yellow-500/90">favorite</div>
              )}
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/history"
        className="mt-4 mx-auto max-w-[200px] block text-center text-sm text-grey hover:text-light-grey transition-colors py-2 rounded-md hover:bg-dark-grey flex items-center justify-center gap-1"
      >
        history <span className="text-xs">→</span>
      </Link>
    </div>
  );
}
