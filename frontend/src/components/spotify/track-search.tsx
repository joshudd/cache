"use client";

import * as React from "react";
import { useEffect, useState } from "react";

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

import { searchTracks, getSpotifyStatus, connectSpotify } from "@/lib/spotify";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

import { Track } from "@/types";
import { X } from "lucide-react";
import { motion } from "framer-motion";

// custom dialog without close btn
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
  const debouncedQuery = useDebounce(query, 300);

  // check spotify status
  useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getSpotifyStatus();
        setIsConnected(status.connected);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  // search effect
  useEffect(() => {
    async function search() {
      if (!debouncedQuery.trim() || !isConnected) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchTracks(debouncedQuery);
        setResults(data.tracks.items);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    }
    search();
  }, [debouncedQuery, isConnected]);

  return (
    <>
      {/* trigger */}
      <div className="relative w-64">
        <Input
          placeholder={checkingStatus ? "Loading..." : isConnected ? "Search for tracks..." : "Search for tracks..."} // should lead users to connect spotify
          className="w-full"
          onClick={() => setIsOpen(true)}
          readOnly
        />
      </div>

      {/* search modal */}
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
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center pt-24 px-4"
          >
            {/* search input or connect message */}
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

            {/* results list */}
            {isConnected && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-2xl mt-4 rounded-lg bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80"
              >
                {(loading || results.length > 0) && (
                  <motion.div
                    layout
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 rounded-lg border-[3px]"
                  >
                    <div className="max-h-[60vh] overflow-y-auto p-4 scrollbar-thin scrollbar-track-rounded [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-dark-grey [@media(hover:none)]:scrollbar-thumb-dark-grey">
                      {loading && (
                        <div className="text-sm text-muted-foreground text-center py-4">
                          ...
                        </div>
                      )}
                      {!loading &&
                        results.length > 0 &&
                        results.map((track, i) => (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              duration: 0.2,
                              delay: i * 0.05,
                              ease: "easeOut",
                            }}
                            className="flex items-center justify-between p-3 hover:bg-accent rounded-md group"
                          >
                            <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 mr-3">
                              <img
                                src={track.image ?? "/placeholder-album.jpg"}
                                alt={`${track.title} album art`}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">
                                {track.title}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {track.artist}
                              </div>
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              cache
                            </Button>
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        </CustomDialogContent>
      </Dialog>
    </>
  );
}
