"use client";

import { useEffect, useState } from "react";
import { getRecentlyPlayed } from "@/lib/spotify";
import { checkCachedTracks } from "@/lib/cache";
import { formatDistanceToNow } from "date-fns";
import { createCache } from "@/lib/cache";

type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string | null;
  played_at: string;
};

const TrackCard = ({
  t,
  cacheId,
  onCache,
  isCached,
}: {
  t: Track;
  cacheId: string;
  onCache: (t: Track) => void;
  isCached: boolean;
}) => (
  <div key={`${t.id}-${t.played_at}`}>
    <button
      onClick={() => onCache(t)}
      className="group relative hover:z-10 min-w-[200px] max-w-sm w-fit"
    >
      <div className="absolute -top-4 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className={`${isCached ? "bg-purple-500" : "bg-primary"} text-xs text-black font-medium px-3 py-0.5 rounded-tr-md shadow-sm`}>
          {isCached ? "cached" : "cache"}
        </div>
      </div>
      <div
        className={`bg-dark-grey rounded-lg overflow-hidden group-hover:rounded-tl-none ${
          isCached 
            ? "group-hover:border-purple-500" 
            : "group-hover:border-primary"
        } group-hover:border-2 group-hover:m-1 transition-all duration-200 flex`}
      >
        <div className={`flex flex-1 ${isCached ? "opacity-50" : ""}`}>
          {t.image ? (
            <img
              src={t.image}
              alt={t.title}
              className="h-16 w-16 rounded-l-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-16 w-16 bg-black/20 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 py-2 px-4 text-left">
            <p className="font-medium text-xs truncate">{t.title}</p>
            <p className="text-xs text-light-grey truncate">{t.artist}</p>
            <p className="text-xs text-light-grey/60">
              {formatDistanceToNow(new Date(t.played_at), { addSuffix: true })}
            </p>
          </div>
        </div>
      </div>
    </button>
  </div>
);

export default function RecentSummary() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [cacheId, setCacheId] = useState("");
  const [cachedTracks, setCachedTracks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await getRecentlyPlayed();
        setTracks(data.tracks);
        
        // check which tracks are already cached
        const trackIds = data.tracks.map((t: Track) => t.id);
        const cachedData = await checkCachedTracks(trackIds);
        setCachedTracks(new Set(cachedData.cached_ids));
      } catch (e) {
        setErr("failed to load");
      } finally {
        setLoading(false);
      }
    };
    
    loadTracks();
  }, []);

  const cache = async (t: Track) => {
    if (cachedTracks.has(t.id)) return;
    try {
      setCacheId(t.id);
      await createCache({
        spotify_id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        image_url: t.image ?? undefined,
      });
      setCachedTracks(prev => new Set([...prev, t.id]));
      setTimeout(() => setCacheId(""), 1000);
    } catch {
      setCacheId("");
    }
  };

  if (loading)
    return <div className="bg-dark-grey rounded-lg p-4">loading...</div>;
  if (err)
    return (
      <div className="bg-dark-grey rounded-lg p-4 text-red-500">{err}</div>
    );

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-4">
      {tracks.map((t) => (
        <TrackCard
          key={`${t.id}-${t.played_at}`}
          t={t}
          cacheId={cacheId}
          onCache={cache}
          isCached={cachedTracks.has(t.id)}
        />
      ))}
    </div>
  );
}
