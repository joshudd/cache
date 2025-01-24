"use client";

import { useEffect, useState } from "react";
import { getAllTracks, deleteTrack, onTrackUpdate, makeAvailable } from "@/lib/track";
import { format, isThisWeek, isThisMonth, subDays, isWithinInterval, differenceInDays, differenceInHours, differenceInMinutes } from "date-fns";
import { Trash2, CalendarIcon, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import TransitionChild from "@/components/transition/transition-child";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { addTracksToPlaylist, getPlaylistSettings, removeTracksFromPlaylist } from "@/lib/spotify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Track } from "@/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import VaultInfoTip from "@/components/widgets/vault-info-tip";

interface GroupedTracks {
  [key: string]: Track[];
}

interface RecentlyUnearthed {
  track: Track;
  index: number;
  isFadingOut?: boolean;
}

// add time remaining component
function TimeRemaining({ availableAt }: { availableAt?: string }) {
  if (!availableAt) return null;
  
  const now = new Date();
  const available = new Date(availableAt);
  
  if (now >= available) return null;
  
  const days = differenceInDays(available, now);
  const hours = differenceInHours(available, now) % 24;
  const minutes = differenceInMinutes(available, now) % 60;
  
  return (
    <div className="text-xs text-primary/70">
      {days > 0 ? `${days}d ` : ''}{hours > 0 ? `${hours}h ` : ''}{minutes}m remaining
    </div>
  );
}

// time progress component
function TimeProgress({ track }: { track: Track }) {
  if (!track.locked_at) return null;
  
  const now = new Date();
  const lockedDate = new Date(track.locked_at);
  const availableDate = track.available_at ? new Date(track.available_at) : null;
  
  // calc progress
  const totalDuration = availableDate ? availableDate.getTime() - lockedDate.getTime() : 0;
  const elapsed = now.getTime() - lockedDate.getTime();
  const progress = totalDuration > 0 ? Math.min((elapsed / totalDuration) * 100, 100) : 0;
  
  // format time display
  const getTimeDisplay = () => {
    const elapsedDays = Math.floor(elapsed / (1000 * 60 * 60 * 24));
    
    if (track.status === 'revealed') {
      return `sealed for ${elapsedDays}d`;
    } else if (track.status === 'available') {
      return `ready after ${elapsedDays}d`;
    }
    
    return `${elapsedDays}d sealed`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-white/50">{getTimeDisplay()}</div>
      {track.status === 'pending' && (
        <div className="w-24 h-1 bg-dark-grey/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary/70 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// track card component for vault
function TrackCard({ track, onDelete, onUnlockEarly, onUnearth }: { 
  track: Track; 
  onDelete: (id: number) => void;
  onUnlockEarly: (id: number) => void;
  onUnearth: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-4 min-h-[72px] hover:bg-dark-grey/30 rounded-lg p-4 transition-colors group">
      {/* album art */}
      <div className="w-12 h-12 flex-shrink-0">
        <img
          src={track.metadata.image_url ?? "/placeholder-album.jpg"}
          alt={`${track.metadata.title} album art`}
          className="h-full w-full object-cover rounded-sm"
        />
      </div>

      {/* main content */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm text-white/90 truncate">
            {track.metadata.title}
          </p>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-medium",
            track.status === 'pending' && "bg-purple-500/10 text-purple-500/90",
            track.status === 'available' && "bg-green-200/10 text-green-200/90",
            track.status === 'revealed' && "bg-yellow-500/10 text-yellow-500/90"
          )}>
            {track.status === 'pending' ? 'sealed' :
             track.status === 'available' ? 'ready' :
             'unearthed'}
          </div>
        </div>
        <p className="text-xs text-white/70 truncate mt-0.5">
          {track.metadata.artist} • {track.metadata.album}
          {track.metadata.release_date && (
            <span className="text-white/30"> • {track.metadata.release_date.split('-')[0]}</span>
          )}
        </p>
        <div className="flex items-center gap-4 mt-1">
          <TimeProgress track={track} />
          {track.status === 'pending' && <TimeRemaining availableAt={track.available_at} />}
        </div>
      </div>

      {/* actions */}
      <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
        {track.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnlockEarly(track.id)}
            className="text-green-200 hover:text-green-200 hover:bg-green-200/10 h-8"
          >
            unlock early
          </Button>
        )}
        {track.status === 'available' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUnearth(track.id)}
            className="text-primary hover:text-primary hover:bg-primary/10 h-8"
          >
            unearth
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(track.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

type SortOption = 'newest' | 'oldest' | 'title' | 'artist';
type DateFilter = 'all' | 'week' | 'month' | 'custom';
type TabType = 'all' | 'sealed' | 'excavation-ready' | 'unearthed';

// loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-16">
      {[...Array(3)].map((_, groupIndex) => (
        <div key={groupIndex} className="mb-12">
          <Skeleton className="h-7 w-32 mb-4" />
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_160px_140px] items-center min-h-[72px] rounded-lg bg-dark-grey/30">
                <div className="flex items-center gap-4 px-4 h-full">
                  <Skeleton className="w-10 h-10 flex-shrink-0" />
                  <div className="flex-1 py-1">
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <div className="px-4">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="px-4">
                  <Skeleton className="h-8 w-20 float-right" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function VaultPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [playlistId, setPlaylistId] = useState<string | null>(null);
  const [recentlyUnearthed, setRecentlyUnearthed] = useState<RecentlyUnearthed | null>(null);
  const { toast } = useToast();

  // fetch tracks and playlist settings
  const fetchData = async () => {
    try {
      const data = await getAllTracks();
      setTracks(data);

      // get playlist settings
      const settings = await getPlaylistSettings();
      setPlaylistId(settings.playlist_id);
    } catch (error) {
      console.error('failed to fetch data:', error);
      setTracks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const unsubscribe = onTrackUpdate(fetchData);
    return () => unsubscribe();
  }, []);

  // check for tracks that should be available
  const checkTrackStatus = () => {
    const now = new Date();
    setTracks(prevTracks => 
      prevTracks.map(track => {
        if (track.status === 'pending' && track.available_at && new Date(track.available_at) <= now) {
          return { ...track, status: 'available' };
        }
        return track;
      })
    );
  };

  useEffect(() => {
    const statusInterval = setInterval(checkTrackStatus, 60000);
    // initial check
    checkTrackStatus();

    return () => {
      clearInterval(statusInterval);
    };
  }, []);

  // sort and filter tracks
  const getSortedAndFilteredTracks = () => {
    let filtered = [...tracks];
    
    // apply date filter
    if (dateFilter === 'week') {
      filtered = filtered.filter(track => track.locked_at && isThisWeek(new Date(track.locked_at)));
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(track => track.locked_at && isThisMonth(new Date(track.locked_at)));
    } else if (dateFilter === 'custom' && dateRange?.from) {
      filtered = filtered.filter(track => {
        const trackDate = track.locked_at ? new Date(track.locked_at) : new Date();
        const endDate = dateRange.to || dateRange.from;
        if (!dateRange.from || !endDate) return true;
        return isWithinInterval(trackDate, {
          start: dateRange.from,
          end: endDate
        });
      });
    }

    // apply sorting
    return filtered.sort((a, b) => {
      const aDate = a.locked_at ? new Date(a.locked_at) : new Date();
      const bDate = b.locked_at ? new Date(b.locked_at) : new Date();
      switch (sortBy) {
        case 'newest':
          return bDate.getTime() - aDate.getTime();
        case 'oldest':
          return aDate.getTime() - bDate.getTime();
        case 'title':
          return a.metadata.title.localeCompare(b.metadata.title);
        case 'artist':
          return a.metadata.artist.localeCompare(b.metadata.artist);
        default:
          return 0;
      }
    });
  };

  // group tracks by time period
  const getGroupedTracks = () => {
    const filtered = getFilteredTracks();
    const groups: { [key: string]: Track[] } = {
      'Recent Discoveries': [],
      'This Month\'s Finds': [],
      'Ancient History': []
    };

    // if we have a recently unearthed track, add it back to the filtered list
    if (recentlyUnearthed) {
      filtered.splice(recentlyUnearthed.index, 0, recentlyUnearthed.track);
    }

    filtered.forEach(track => {
      const trackDate = track.locked_at ? new Date(track.locked_at) : new Date();
      if (isThisWeek(trackDate)) {
        groups['Recent Discoveries'].push(track);
      } else if (isThisMonth(trackDate)) {
        groups['This Month\'s Finds'].push(track);
      } else {
        groups['Ancient History'].push(track);
      }
    });

    return groups;
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTrack(id);
      // update state by removing the deleted track
      setTracks(prevTracks => {
        const newTracks = [...prevTracks];
        return newTracks.filter(track => track.id !== id);
      });
    } catch (error) {
      console.error('Failed to delete track:', error);
    }
  };

  const handleUnlockEarly = async (id: number) => {
    try {
      await makeAvailable(id);
      setTracks(prevTracks => {
        const newTracks = [...prevTracks];
        return newTracks.map(track => 
          track.id === id ? { ...track, status: 'available' as const } : track
        );
      });
    } catch (error) {
      console.error('Failed to unlock track early:', error);
    }
  };

  const handleUnearth = async (id: number, index: number) => {
    if (!playlistId) {
      toast({
        title: "no playlist selected",
        description: "please select a playlist in settings first",
        variant: "destructive",
      });
      return;
    }

    try {
      const track = tracks.find(t => t.id === id);
      if (!track) return;

      await addTracksToPlaylist(playlistId, [track.metadata.spotify_id]);
      // track status will be updated automatically via the backend
      setTracks(prevTracks => {
        const newTracks = [...prevTracks];
        return newTracks.map(t => 
          t.id === id ? { ...t, status: 'revealed' as const } : t
        );
      });
      
      // set recently unearthed for undo
      setRecentlyUnearthed({ track, index });
      // start fade out after 14.7 seconds (allowing 300ms for fade)
      setTimeout(() => {
        setRecentlyUnearthed(prev => prev ? { ...prev, isFadingOut: true } : null);
      }, 14700);
      // clear undo after fade out
      setTimeout(() => {
        setRecentlyUnearthed(null);
      }, 15000);

      toast({
        title: "track unearthed",
        description: `${track.metadata.title} has been added to your playlist`,
      });
    } catch (error) {
      console.error('Failed to unearth track:', error);
      toast({
        title: "error",
        description: "failed to unearth track",
        variant: "destructive",
      });
    }
  };

  const handleUndoUnearth = async () => {
    if (recentlyUnearthed && playlistId) {
      try {
        // remove track from playlist
        await removeTracksFromPlaylist(playlistId, [recentlyUnearthed.track.metadata.spotify_id]);
        // add track back to local state at original index
        setTracks(prevTracks => {
          const newTracks = [...prevTracks];
          const updatedTrack = { ...recentlyUnearthed.track, status: 'available' as const };
          newTracks.splice(recentlyUnearthed.index, 0, updatedTrack);
          return newTracks;
        });
        setRecentlyUnearthed(null);
        toast({
          title: "undo successful",
          description: `${recentlyUnearthed.track.metadata.title} restored to ready tracks`,
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

  // filter tracks by status
  const getFilteredTracks = () => {
    let filtered = [...tracks];
    
    // filter by tab
    if (activeTab === 'sealed') {
      filtered = filtered.filter(track => track.status === 'pending');
    } else if (activeTab === 'excavation-ready') {
      filtered = filtered.filter(track => track.status === 'available');
    } else if (activeTab === 'unearthed') {
      filtered = filtered.filter(track => track.status === 'revealed');
    }

    // apply date filter
    if (dateFilter === 'week') {
      filtered = filtered.filter(track => track.locked_at && isThisWeek(new Date(track.locked_at)));
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(track => track.locked_at && isThisMonth(new Date(track.locked_at)));
    } else if (dateFilter === 'custom' && dateRange?.from) {
      filtered = filtered.filter(track => {
        const trackDate = track.locked_at ? new Date(track.locked_at) : new Date();
        const endDate = dateRange.to || dateRange.from;
        if (!dateRange.from || !endDate) return true;
        return isWithinInterval(trackDate, {
          start: dateRange.from,
          end: endDate
        });
      });
    }

    // apply sorting
    return filtered.sort((a, b) => {
      const aDate = a.locked_at ? new Date(a.locked_at) : new Date();
      const bDate = b.locked_at ? new Date(b.locked_at) : new Date();
      switch (sortBy) {
        case 'newest':
          return bDate.getTime() - aDate.getTime();
        case 'oldest':
          return aDate.getTime() - bDate.getTime();
        case 'title':
          return a.metadata.title.localeCompare(b.metadata.title);
        case 'artist':
          return a.metadata.artist.localeCompare(b.metadata.artist);
        default:
          return 0;
      }
    });
  };

  // create list of items including tracks and undo placeholder
  const items = [...getFilteredTracks()];
  if (recentlyUnearthed) {
    items.splice(recentlyUnearthed.index, 0, recentlyUnearthed.track);
  }

  return (
    <TransitionChild id="vault">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <div className="flex justify-between items-center">
            <PageBreadcrumb />
            <VaultInfoTip />
          </div>
          
          <div className="mt-8">
            <Tabs 
              defaultValue="all" 
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as TabType)}
              className="w-full"
            >
              <TabsList className="w-full justify-start gap-1 bg-dark-grey/30">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:bg-light-grey data-[state=active]:text-black"
                >
                  All ({tracks.length})
                </TabsTrigger>
                <TabsTrigger 
                  value="sealed" 
                  className="data-[state=active]:bg-purple-500 data-[state=active]:text-black"
                >
                  Sealed ({tracks.filter(t => t.status === 'pending').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="excavation-ready" 
                  className="data-[state=active]:bg-green-200 data-[state=active]:text-black"
                >
                  Ready ({tracks.filter(t => t.status === 'available').length})
                </TabsTrigger>
                <TabsTrigger 
                  value="unearthed" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-black"
                >
                  Unearthed ({tracks.filter(t => t.status === 'revealed').length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-3">
                    <Select value={dateFilter} onValueChange={(value: DateFilter) => setDateFilter(value)}>
                      <SelectTrigger className="w-[140px] bg-dark-grey border-none">
                        <SelectValue placeholder="Filter by date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>

                    {dateFilter === 'custom' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-[240px] justify-start text-left font-normal bg-dark-grey border-none",
                              !dateRange && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateRange?.from ? (
                              dateRange.to ? (
                                <>
                                  {format(dateRange.from, "LLL dd, y")} -{" "}
                                  {format(dateRange.to, "LLL dd, y")}
                                </>
                              ) : (
                                format(dateRange.from, "LLL dd, y")
                              )
                            ) : (
                              <span>Pick a date range</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={dateRange?.from || new Date()}
                            selected={dateRange}
                            onSelect={setDateRange}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    
                    <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                      <SelectTrigger className="w-[140px] bg-dark-grey border-none">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Recently Sealed</SelectItem>
                        <SelectItem value="oldest">First Sealed</SelectItem>
                        <SelectItem value="title">Artifact Name</SelectItem>
                        <SelectItem value="artist">Artist Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {isLoading ? (
                  <LoadingSkeleton />
                ) : (
                  <motion.div 
                    className="flex flex-col gap-16"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: {},
                      visible: {
                        transition: {
                          staggerChildren: 0.1
                        }
                      }
                    }}
                  >
                    {Object.entries(getGroupedTracks()).map(([period, periodTracks]) => 
                      periodTracks.length > 0 && (
                        <motion.div 
                          key={period} 
                          className="mb-12"
                          variants={{
                            hidden: { opacity: 0, y: 5 },
                            visible: { opacity: 1, y: 0 }
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          <h2 className="text-xl font-semibold mb-4">{period}</h2>
                          <div className="grid grid-cols-1 gap-4">
                            {periodTracks.map((track, index) => {
                              // if this is the recently unearthed track, show undo placeholder
                              if (recentlyUnearthed && track.id === recentlyUnearthed.track.id) {
                                return (
                                  <div key={`${period}-${track.id}`} className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 min-h-[72px] bg-dark-grey/20 rounded-lg p-4 group opacity-80 ${recentlyUnearthed.isFadingOut ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-300'}`}>
                                    <div className="w-12 h-12 flex-shrink-0 opacity-50">
                                      <img
                                        src={track.metadata.image_url ?? "/placeholder-album.jpg"}
                                        alt={`${track.metadata.title} album art`}
                                        className="h-full w-full object-cover rounded-sm"
                                      />
                                    </div>
                                    <div className="flex flex-col min-w-0 opacity-50">
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm text-white/90 truncate">
                                          {track.metadata.title}
                                        </p>
                                        <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary/90">
                                          unearthed
                                        </div>
                                      </div>
                                      <p className="text-xs text-white/70 truncate mt-0.5">
                                        {track.metadata.artist} • {track.metadata.album}
                                      </p>
                                      <p className="text-xs text-white/40 truncate mt-0.5">
                                        added to playlist
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleUndoUnearth}
                                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                                      >
                                        <Undo2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <TrackCard 
                                  key={`${period}-${track.id}`} 
                                  track={track} 
                                  onDelete={handleDelete}
                                  onUnlockEarly={handleUnlockEarly}
                                  onUnearth={(id) => handleUnearth(id, index)}
                                />
                              );
                            })}
                          </div>
                        </motion.div>
                      )
                    )}

                    {getFilteredTracks().length === 0 && (
                      <motion.div 
                        className="text-center text-muted-foreground"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {activeTab === 'all' && "Your vault is empty. Start sealing some artifacts!"}
                        {activeTab === 'sealed' && "No sealed artifacts found. They're waiting to be discovered!"}
                        {activeTab === 'excavation-ready' && "No artifacts ready for excavation yet. Check back soon!"}
                        {activeTab === 'unearthed' && "You haven't unearthed any artifacts yet. Time to start digging!"}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TransitionChild>
  );
} 