"use client";

import { useEffect, useState } from "react";
import { getTracks, onTrackUpdate, notifyTrackUpdate } from "@/lib/track";
import { getPlaylistSettings, addTracksToPlaylist, removeTracksFromPlaylist } from "@/lib/spotify";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Undo2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Track } from "@/types";
import Link from "next/link";

interface RecentlyAddedTrack {
  track: Track;
  index: number;
  isFadingOut?: boolean;
}

// ready tracks widget component
export default function ReadyTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [recentlyAdded, setRecentlyAdded] = useState<RecentlyAddedTrack | null>(null);
  const { toast } = useToast();

  // fetch tracks and playlist settings
  const fetchData = async () => {
    try {
      // get available tracks
      const data = await getTracks(5, "available");
      setTracks(data || []);

      // get playlist settings
      const settings = await getPlaylistSettings();
      setPlaylistId(settings.playlist_id);
    } catch (error) {
      console.error("failed to fetch data:", error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // subscribe to track updates
    const unsubscribe = onTrackUpdate(fetchData);
    return () => unsubscribe();
  }, []);

  // add track to playlist
  const handleAddToPlaylist = async (track: Track, index: number) => {
    if (!playlistId) {
      toast({
        title: "no playlist selected",
        description: "please select a playlist in settings first",
        variant: "destructive",
      });
      return;
    }

    try {
      await addTracksToPlaylist(playlistId, [track.metadata.spotify_id]);
      // notify track update to refresh all track lists
      notifyTrackUpdate();
      toast({
        title: "track added",
        description: `${track.metadata.title} added to playlist`,
      });
      // remove track from local state
      setTracks(tracks => tracks.filter(t => t.id !== track.id));
      // set recently added for undo with original index
      setRecentlyAdded({ track, index });
      // start fade out after 14.7 seconds (allowing 300ms for fade)
      setTimeout(() => {
        setRecentlyAdded(prev => prev ? { ...prev, isFadingOut: true } : null);
      }, 14700);
      // clear undo after fade out
      setTimeout(() => {
        setRecentlyAdded(null);
      }, 10000);
    } catch (error) {
      console.error("failed to add track to playlist:", error);
      toast({
        title: "error",
        description: "failed to add track to playlist",
        variant: "destructive",
      });
    }
  };

  // handle undo
  const handleUndo = async () => {
    if (recentlyAdded && playlistId) {
      try {
        // remove track from playlist
        await removeTracksFromPlaylist(playlistId, [recentlyAdded.track.metadata.spotify_id]);
        // add track back to local state at original index
        setTracks(tracks => {
          const newTracks = [...tracks];
          newTracks.splice(recentlyAdded.index, 0, recentlyAdded.track);
          return newTracks;
        });
        setRecentlyAdded(null);
        // notify track update to refresh all track lists
        notifyTrackUpdate();
        toast({
          title: "undo successful",
          description: `${recentlyAdded.track.metadata.title} restored to ready tracks`,
        });
      } catch (error) {
        console.error("failed to undo:", error);
        toast({
          title: "error",
          description: "failed to undo track addition",
          variant: "destructive",
        });
      }
    }
  };

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
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tracks.length === 0 && !recentlyAdded) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <div className="text-sm text-muted-foreground">no ready tracks</div>
      </div>
    );
  }

  // create list of items including tracks and undo placeholder
  const items = [...tracks];
  if (recentlyAdded) {
    items.splice(recentlyAdded.index, 0, recentlyAdded.track);
  }

  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
      <div className="space-y-3 animate-in fade-in duration-500">
        {items.map((track, index) => {
          // if this is the recently added track, show undo placeholder
          if (recentlyAdded && track.id === recentlyAdded.track.id) {
            return (
              <div key={track.id} className={`flex items-center gap-3 bg-dark-grey/20 rounded-lg p-2 group opacity-80 ${recentlyAdded.isFadingOut ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-300'}`}>
                <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 opacity-50">
                  <img
                    src={track.metadata.image_url ?? "/placeholder-album.jpg"}
                    alt={track.metadata.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1 opacity-50">
                  <p className="font-medium text-sm text-white truncate">
                    {track.metadata.title}
                  </p>
                  <p className="text-xs text-white/70 truncate mt-0.5">
                    {track.metadata.artist}
                  </p>
                  <p className="text-xs text-white/40 truncate mt-0.5">
                    added to playlist
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          // show normal track
          return (
            <div
              key={track.id}
              className="flex items-center gap-3 hover:bg-dark-grey/50 transition-colors rounded-lg p-2 group"
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
                  {track.available_at && (
                    <span className="text-white/30"> • ready {formatDistanceToNow(new Date(track.available_at), {
                      addSuffix: true,
                    })}</span>
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleAddToPlaylist(track, index)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          );
        })}
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