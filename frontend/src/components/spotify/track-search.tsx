"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TrackCard } from "./track-card";

import { searchTracks, getSpotifyStatus, connectSpotify } from "@/lib/spotify";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { createTrack, checkTracksStatus, onTrackUpdate } from "@/lib/track";
import { Track } from "@/types";
import { Skeleton } from "../ui/skeleton";

// dialog content without close btn
const CustomDialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
));
CustomDialogContent.displayName = "CustomDialogContent";

export default function TrackSearch() {
  // state
  const [query, setQuery] = useState("");
  const [displayResults, setDisplayResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [lockedTracks, setLockedTracks] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(query, 300);

  // handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  // check spotify connection
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getSpotifyStatus();
        setIsConnected(status.connected);
      } catch (error) {
        console.error("failed to check spotify status:", error);
        setIsConnected(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  // update locked tracks when lock status changes or results update
  useEffect(() => {
    // only subscribe when dialog is open
    if (!isOpen) return;

    const updateLockedTracks = async () => {
      // only check if we have results to check against
      if (displayResults.length === 0) return;

      const trackIds = displayResults.map((t: Track) => t.metadata.spotify_id);
      const lockedData = await checkTracksStatus(trackIds);
      setLockedTracks(new Set(lockedData.locked_ids));
    };

    // run initial check and subscribe to updates
    updateLockedTracks();
    const unsubscribe = onTrackUpdate(updateLockedTracks);
    return () => unsubscribe();
  }, [displayResults, isOpen]);

  // set loading state immediately on query change
  useEffect(() => {
    if (!query.trim() || !isConnected) {
      setLoading(false);
      return;
    }
    setLoading(true);
  }, [query, isConnected]);

  // search tracks
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim() || !isConnected) {
        setDisplayResults([]);
        setLoading(false);
        return;
      }

      try {
        const data = await searchTracks(debouncedQuery);
        const tracks = data.tracks.items;
        setDisplayResults(tracks);

        // check which tracks are already locked
        const trackIds = tracks.map((t: Track) => t.metadata.spotify_id);
        const lockedData = await checkTracksStatus(trackIds);
        setLockedTracks(new Set(lockedData.locked_ids));
      } catch (error) {
        console.error("search failed:", error);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery, isConnected]);

  // lock track handler
  const handleLock = async (track: Track) => {
    try {
      await createTrack({
        spotify_id: track.metadata.spotify_id,
        title: track.metadata.title,
        artist: track.metadata.artist,
        album: track.metadata.album,
        image_url: track.metadata.image_url,
        release_date: track.metadata.release_date,
        preview_url: track.metadata.preview_url,
      });

      // update locked tracks state
      setLockedTracks(
        (prevTracks: Set<string>) =>
          new Set([...prevTracks, track.metadata.spotify_id])
      );

      toast({
        title: "Track sealed",
        description: `${track.metadata.title} by ${track.metadata.artist} has been sealed`,
      });
    } catch (error) {
      console.error("failed to seal track:", error);
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to seal track",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <div className="relative w-64">
        <Input
          placeholder={checkingStatus ? "Loading..." : "Search for tracks..."}
          className="w-full hover:border-primary hover:ring-primary hover:placeholder:text-primary placeholder:transition-colors transition-colors"
          onClick={() => setIsOpen(true)}
          readOnly
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <CustomDialogContent className="max-w-3xl p-0 gap-0 bg-transparent border-none">
          <VisuallyHidden asChild>
            <DialogTitle>Search Tracks</DialogTitle>
          </VisuallyHidden>
          <VisuallyHidden asChild>
            <DialogDescription>
              Search for music tracks to add to your library
            </DialogDescription>
          </VisuallyHidden>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="w-full flex flex-col items-center pt-24 px-4"
          >
            <motion.div
              layout
              className="relative w-full max-w-2xl sticky top-24 z-50"
            >
              {isConnected ? (
                <div className="relative bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85 rounded-lg shadow-lg">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for tracks..."
                    className="w-full h-14 text-lg pl-6 pr-16 border-[3px]"
                    autoFocus
                  />
                  <span className="absolute right-2 top-0 -translate-y-full text-xs text-light-grey mb-1">
                    esc to exit
                  </span>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {loading && (
                      <Loader2 className="h-4 w-4 animate-spin text-grey" />
                    )}
                    {query && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setQuery("")}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full text-center p-6 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 rounded-lg border-[3px]">
                  <h3 className="text-lg font-medium mb-2">
                    Connect Spotify to Search
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to connect your Spotify account to search tracks
                  </p>
                  <Button onClick={connectSpotify}>Connect Spotify</Button>
                </div>
              )}
            </motion.div>

            {isConnected && (loading || displayResults.length > 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mt-4 rounded-lg bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
              >
                <motion.div
                  layout
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 rounded-lg border-[3px]"
                >
                  <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin scrollbar-track-rounded [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-dark-grey [@media(hover:none)]:scrollbar-thumb-dark-grey">
                    {loading && displayResults.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                        {["sk1", "sk2", "sk3"].map((id, index) => (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="flex items-start space-x-4 p-2.5 rounded-lg border"
                          >
                            <Skeleton className="h-12 w-12 rounded-md" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-3 w-3/4" />
                              <Skeleton className="h-2 w-1/2" />
                            </div>
                            <Skeleton className="h-7 w-7 rounded-full" />
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayResults.map((track, i) => (
                          <TrackCard
                            key={track.metadata.spotify_id}
                            track={track}
                            index={i}
                            isLocked={lockedTracks.has(
                              track.metadata.spotify_id
                            )}
                            onLock={handleLock}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </CustomDialogContent>
      </Dialog>
    </>
  );
}
