"use client";

import { useEffect, useState } from "react";
import { getAllTracks, deleteTrack, onTrackUpdate, revealTrack } from "@/lib/track";
import { format, isThisWeek, isThisMonth, subDays, isWithinInterval } from "date-fns";
import { Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import TransitionChild from "@/components/transition/transition-child";
import { cn } from "@/lib/utils";
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

interface GroupedTracks {
  [key: string]: Track[];
}

// track card component for history
function TrackCard({ track, onDelete, onDigUp }: { 
  track: Track; 
  onDelete: (id: number) => void;
  onDigUp: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_160px_140px] items-center min-h-[72px] hover:bg-dark-grey/30 rounded-lg transition-colors group">
      {/* track info column */}
      <div className="flex items-center gap-4 px-4 h-full">
        <div className="w-10 h-10 flex-shrink-0">
          <img
            src={track.metadata.image_url ?? "/placeholder-album.jpg"}
            alt={`${track.metadata.title} album art`}
            className="h-full w-full object-cover rounded-sm"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className="font-medium text-sm text-white/90 truncate">
            {track.metadata.title}
          </p>
          <p className="text-xs text-white/70 truncate mt-0.5">
            {track.metadata.artist}
          </p>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {track.metadata.album}
            {track.metadata.release_date && (
              <span className="text-white/30"> • {track.metadata.release_date.split('-')[0]}</span>
            )}
          </p>
        </div>
      </div>

      {/* date column */}
      <div className="px-4 text-right">
        <p className="text-sm font-medium text-white/70">
          {track.locked_at ? format(new Date(track.locked_at), 'MMM d, yyyy') : ''}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {track.locked_at ? format(new Date(track.locked_at), 'h:mm a') : ''}
        </p>
      </div>

      {/* options column */}
      <div className="flex items-center justify-end gap-2 px-4 opacity-60 group-hover:opacity-100 transition-opacity">
        {track.status === 'pending' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDigUp(track.id)}
            className="text-primary hover:text-primary hover:bg-primary/10 h-8"
          >
            dig up early
          </Button>
        )}
        {track.status === 'available' && (
          <div className="text-xs font-medium text-purple-500/90">available</div>
        )}
        {track.status === 'revealed' && (
          <div className="text-xs font-medium text-yellow-500/90">revealed</div>
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

export default function HistoryPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // fetch tracks
  const fetchTracks = async () => {
    try {
      const data = await getAllTracks();
      setTracks(data);
    } catch (error) {
      console.error('failed to fetch tracks:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    const sorted = getSortedAndFilteredTracks();
    const groups: { [key: string]: Track[] } = {
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    sorted.forEach(track => {
      const trackDate = track.locked_at ? new Date(track.locked_at) : new Date();
      if (isThisWeek(trackDate)) {
        groups['This Week'].push(track);
      } else if (isThisMonth(trackDate)) {
        groups['This Month'].push(track);
      } else {
        groups['Older'].push(track);
      }
    });

    return groups;
  };

  useEffect(() => {
    fetchTracks();
    const unsubscribe = onTrackUpdate(fetchTracks);
    return () => unsubscribe();
  }, []);

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

  const handleDigUp = async (id: number) => {
    try {
      await revealTrack(id);
      // update track status in state
      setTracks(prevTracks => {
        const newTracks = [...prevTracks];
        return newTracks.map(track => 
          track.id === id ? { ...track, status: 'revealed' as const } : track
        );
      });
    } catch (error) {
      console.error('Failed to dig up track:', error);
    }
  };

  return (
    <TransitionChild id="history">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <PageBreadcrumb />
          
          <div className="flex justify-between items-center mt-8 mb-6">
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
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="title">By Title</SelectItem>
                  <SelectItem value="artist">By Artist</SelectItem>
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
              {Object.entries(getGroupedTracks()).map(([period, periodTracks]) => (
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
                      {periodTracks.map((track) => (
                        <TrackCard 
                          key={track.id} 
                          track={track} 
                          onDelete={handleDelete}
                          onDigUp={handleDigUp}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              ))}

              {tracks.length === 0 && (
                <motion.div 
                  className="text-center text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  no tracks found
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </TransitionChild>
  );
} 