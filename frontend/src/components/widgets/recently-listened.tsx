"use client";

import { useEffect, useState } from "react";
import { getRecentlyPlayed } from "@/lib/spotify";
import { checkTracksStatus, createTrack } from "@/lib/track";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "../ui/skeleton";
import Image from "next/image";

interface Track { 
  id: string;
  title: string;
  artist: string;
  album: string;
  image: string;
  release_date: string;
  played_at: string;
}
interface TrackItemProps {
  t: Track;
  onClick: () => void;
  isSealed: boolean;
}

function TrackItem({ t, onClick, isSealed }: TrackItemProps) {
  return (
    <div>
      <button
        onClick={onClick}
        className="group relative hover:z-10 min-w-[200px] max-w-sm w-fit"
      >
        <div className="absolute -top-4 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className={`${
              isSealed ? "bg-purple-500" : "bg-primary"
            } text-xs text-black font-medium px-3 py-0.5 rounded-tr-md shadow-sm`}
          >
            {isSealed ? "sealed" : "seal"}
          </div>
        </div>
        <div
          className={`bg-dark-grey rounded-lg overflow-hidden group-hover:rounded-tl-none ${
            isSealed
              ? "group-hover:border-purple-500"
              : "group-hover:border-primary"
          } group-hover:border-2 group-hover:m-1 transition-all duration-200 flex`}
        >
          <div className={`flex flex-1 ${isSealed ? "opacity-50" : ""}`}>
            <Image
              src={t.image ?? "/placeholder-album.jpg"}
              alt={`${t.title} album art`}
              width={64}
              height={64}
              className="h-16 w-16 object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 py-2 px-4 text-left">
              <p className="font-medium text-xs truncate">{t.title}</p>
              <p className="text-xs text-light-grey truncate">{t.artist}</p>
              <p className="text-xs text-light-grey/60">
                {formatDistanceToNow(
                  new Date(t.played_at ?? new Date().toISOString()),
                  { addSuffix: true }
                )}
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export default function RecentlyListened() {
  const [err, setErr] = useState("");
  const [tracks, setTracks] = useState([]);
  const [sealedTracks, setSealedTracks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracks = async () => {
      try {
        const data = await getRecentlyPlayed();
        setTracks(data.tracks);

        // check which tracks are already sealed (with validation)
        const trackIds = data.tracks.map((t: Track) => t.id);
        const sealedData = await checkTracksStatus(trackIds);
        setSealedTracks(new Set(sealedData.locked_ids));
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load tracks");
      } finally {
        setLoading(false);
      }
    };

    loadTracks();
  }, []);

  const sealTrack = async (t: Track) => {
    try {
      await createTrack({
        spotify_id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        image_url: t.image ?? undefined,
        release_date: t.release_date,
      });
      setSealedTracks((prev) => new Set([...prev, t.id]));
      toast({
        title: `"${t.title}" by ${t.artist} sealed`,
        variant: "default",
      });
    } catch (error) {
      console.error("Failed to seal track:", error);
      if (error instanceof Error) {
        toast({
          title: "Failed to seal track",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Failed to seal track",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    }
  };

  if (loading)
    return (
      <div className="flex flex-wrap gap-x-6 gap-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="min-w-[200px] max-w-sm w-fit">
            <div className="flex gap-4 bg-dark-grey rounded-lg overflow-hidden">
              <Skeleton className="h-16 w-16 rounded-none" />
              <div className="flex-1 py-2 pr-4">
                <Skeleton className="h-3 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  if (err)
    return (
      <div className="bg-dark-grey rounded-lg p-4 text-red-500">{err}</div>
    );

  if (!tracks.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No recently played tracks
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-4 animate-in fade-in duration-500">
      {tracks.map((track: Track) => (
        <TrackItem
          key={track.id}
          t={track}
          onClick={() => sealTrack(track)}
          isSealed={sealedTracks.has(track.id)}
        />
      ))}
    </div>
  );
}
