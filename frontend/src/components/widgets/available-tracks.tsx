import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { getTracks, onTrackUpdate, lockTrack } from "@/lib/track";
import { Track } from "@/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";

// shows tracks that are available to be locked
export default function AvailableTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracks = async () => {
    try {
      // get available tracks
      const data = await getTracks(5, "available");
      setTracks(data || []);
    } catch (error) {
      console.error("failed to fetch tracks:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks();
    // subscribe to track updates
    const unsubscribe = onTrackUpdate(fetchTracks);
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
        <div className="text-sm text-muted-foreground">no available tracks</div>
      </div>
    );
  }

  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
      <div className="space-y-3 animate-in fade-in duration-500">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-3 hover:bg-dark-grey/50 transition-colors rounded-lg p-2"
          >
            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
              <img
                src={track.metadata.image_url ?? "/placeholder-album.jpg"}
                alt={track.metadata.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-white truncate">
                {track.metadata.title}
              </p>
              <p className="text-xs text-white/70 truncate mt-0.5">
                {track.metadata.artist}
              </p>
              <p className="text-xs text-white/40 truncate mt-0.5">
                {track.metadata.album}
                <span className="text-white/30"> • {formatDistanceToNow(new Date(track.created_at), {
                  addSuffix: true,
                })}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
      <Link
        href="/vault"
        className="mt-4 mx-auto max-w-[200px] block text-center text-sm text-grey hover:text-light-grey transition-colors py-2 rounded-md hover:bg-dark-grey flex items-center justify-center gap-1"
      >
        vault <span className="text-xs">→</span>
      </Link>
    </div>
  );
} 