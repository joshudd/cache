"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription } from "../ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { TrackCard } from "./track-card";

import { searchTracks, getSpotifyStatus, connectSpotify } from "@/lib/spotify";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { createCache, checkCachedTracks, onCacheUpdate } from "@/lib/cache";
import { Track } from "@/types";

// dialog content without close btn
const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
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
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [cachedTracks, setCachedTracks] = useState<Set<string>>(new Set());
  const debouncedQuery = useDebounce(query, 300);

  // handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // check spotify connection
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await getSpotifyStatus();
        setIsConnected(status.connected);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, []);

  // update cached tracks when cache changes or results update
  useEffect(() => {
    // only subscribe when dialog is open
    if (!isOpen) return;

    const updateCachedTracks = async () => {
      // only check if we have results to check against
      if (results.length === 0) return;
      
      const trackIds = results.map((t: Track) => t.id);
      const cachedData = await checkCachedTracks(trackIds);
      setCachedTracks(new Set(cachedData.cached_ids));
    };

    // run initial check and subscribe to updates
    updateCachedTracks();
    const unsubscribe = onCacheUpdate(updateCachedTracks);
    return () => unsubscribe();
  }, [results, isOpen]); // add isOpen dependency

  // search tracks
  useEffect(() => {
    const search = async () => {
      if (!debouncedQuery.trim() || !isConnected) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchTracks(debouncedQuery);
        setResults(data.tracks.items);
        
        const trackIds = data.tracks.items.map((t: Track) => t.id);
        const cachedData = await checkCachedTracks(trackIds);
        setCachedTracks(new Set(cachedData.cached_ids));
      } catch (error) {
        console.error("search failed:", error);
      } finally {
        setLoading(false);
      }
    };
    search();
  }, [debouncedQuery, isConnected]);

  // cache track handler
  const handleCache = async (track: Track) => {
    try {
      await createCache({
        spotify_id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        preview_url: track.preview_url,
        image_url: track.image ?? undefined,
        release_date: track.release_date,
        status: 'buried'
      });
      
      // update cached tracks state
      setCachedTracks(prev => new Set([...prev, track.id]));
      
      toast({
        title: "Track cached",
        description: `${track.title} by ${track.artist} has been cached`
      });
    } catch (error) {
      console.error('failed to cache track:', error);
      toast({
        title: "Error",
        description: "Failed to cache track",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="relative w-64">
        <Input
          placeholder={checkingStatus ? "Loading..." : "Search for tracks..."}
          className="w-full"
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
            <DialogDescription>Search for music tracks to add to your library</DialogDescription>
          </VisuallyHidden>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center pt-24 px-4"
          >
            <motion.div layout className="relative w-full max-w-2xl">
              {isConnected ? (
                <>
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for tracks..."
                    className="w-full h-14 text-lg pl-6 pr-6"
                    autoFocus
                  />
                  <span className="absolute right-2 top-0 -translate-y-full text-xs text-light-grey mb-1">
                    esc to exit
                  </span>
                  {query && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-1/2 -translate-y-1/2"
                      onClick={() => setQuery("")}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="w-full text-center p-6 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 rounded-lg border-[3px]">
                  <h3 className="text-lg font-medium mb-2">Connect Spotify to Search</h3>
                  <p className="text-sm text-muted-foreground mb-4">You need to connect your Spotify account to search and cache tracks</p>
                  <Button onClick={connectSpotify}>Connect Spotify</Button>
                </div>
              )}
            </motion.div>

            {isConnected && (loading || results.length > 0) && (
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
                    {loading ? (
                      <div className="text-sm text-muted-foreground text-center py-4">...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((track, i) => (
                          <TrackCard
                            key={track.id}
                            track={track}
                            index={i}
                            isCached={cachedTracks.has(track.id)}
                            onCache={handleCache}
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
