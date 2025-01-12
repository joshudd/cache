"use client";

import { useEffect, useState } from "react";
import { getAllCaches, deleteCache, onCacheUpdate, digUpCache } from "@/lib/cache";
import { format, isThisWeek, isThisMonth, subDays, isWithinInterval } from "date-fns";
import { Trash2, ChevronDown, CalendarIcon } from "lucide-react";
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

interface Cache {
  id: number;
  title: string;
  artist: string;
  album?: string;
  image_url?: string;
  release_date?: string;
  cached_at: string;
  status: 'buried' | 'discovered' | 'favorite';
}

interface GroupedCaches {
  [key: string]: Cache[];
}

// track card component for history
function TrackCard({ cache, onDelete, onDigUp }: { 
  cache: Cache; 
  onDelete: (id: number) => void;
  onDigUp: (id: number) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_160px_140px] items-center min-h-[72px] hover:bg-dark-grey/30 rounded-lg transition-colors group">
      {/* track info column */}
      <div className="flex items-center gap-4 px-4 h-full">
        <div className="w-10 h-10 flex-shrink-0">
          <img
            src={cache.image_url ?? "/placeholder-album.jpg"}
            alt={`${cache.title} album art`}
            className="h-full w-full object-cover rounded-sm"
          />
        </div>
        <div className="flex-1 min-w-0 py-1">
          <p className="font-medium text-sm text-white/90 truncate">
            {cache.title}
          </p>
          <p className="text-xs text-white/70 truncate mt-0.5">
            {cache.artist}
          </p>
          <p className="text-xs text-white/40 truncate mt-0.5">
            {cache.album}
            {cache.release_date && (
              <span className="text-white/30"> • {cache.release_date.split('-')[0]}</span>
            )}
          </p>
        </div>
      </div>

      {/* date column */}
      <div className="px-4 text-right">
        <p className="text-sm font-medium text-white/70">
          {format(new Date(cache.cached_at), 'MMM d, yyyy')}
        </p>
        <p className="text-xs text-white/50 mt-0.5">
          {format(new Date(cache.cached_at), 'h:mm a')}
        </p>
      </div>

      {/* options column */}
      <div className="flex items-center justify-end gap-2 px-4 opacity-60 group-hover:opacity-100 transition-opacity">
        {cache.status === 'buried' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDigUp(cache.id)}
            className="text-primary hover:text-primary hover:bg-primary/10 h-8"
          >
            dig up early
          </Button>
        )}
        {cache.status === 'discovered' && (
          <div className="text-xs font-medium text-purple-500/90">discovered</div>
        )}
        {cache.status === 'favorite' && (
          <div className="text-xs font-medium text-yellow-500/90">favorite</div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(cache.id)}
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
  const [caches, setCaches] = useState<Cache[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // fetch caches
  const fetchCaches = async () => {
    try {
      const data = await getAllCaches();
      setCaches(data);
    } catch (error) {
      console.error('failed to fetch caches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // sort and filter caches
  const getSortedAndFilteredCaches = () => {
    let filtered = [...caches];
    
    // apply date filter
    if (dateFilter === 'week') {
      filtered = filtered.filter(cache => isThisWeek(new Date(cache.cached_at)));
    } else if (dateFilter === 'month') {
      filtered = filtered.filter(cache => isThisMonth(new Date(cache.cached_at)));
    } else if (dateFilter === 'custom' && dateRange?.from) {
      filtered = filtered.filter(cache => {
        const cacheDate = new Date(cache.cached_at);
        const endDate = dateRange.to || dateRange.from;
        if (!dateRange.from || !endDate) return true;
        return isWithinInterval(cacheDate, {
          start: dateRange.from,
          end: endDate
        });
      });
    }

    // apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime();
        case 'oldest':
          return new Date(a.cached_at).getTime() - new Date(b.cached_at).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        default:
          return 0;
      }
    });
  };

  // group caches by time period
  const getGroupedCaches = () => {
    const sorted = getSortedAndFilteredCaches();
    const now = new Date();
    const groups: { [key: string]: Cache[] } = {
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    sorted.forEach(cache => {
      const cacheDate = new Date(cache.cached_at);
      if (isThisWeek(cacheDate)) {
        groups['This Week'].push(cache);
      } else if (isThisMonth(cacheDate)) {
        groups['This Month'].push(cache);
      } else {
        groups['Older'].push(cache);
      }
    });

    return groups;
  };

  useEffect(() => {
    fetchCaches();
    const unsubscribe = onCacheUpdate(fetchCaches);
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteCache(id);
      // update state by removing the deleted cache
      setCaches(prevCaches => {
        const newCaches = [...prevCaches];
        return newCaches.filter(cache => cache.id !== id);
      });
    } catch (error) {
      console.error('Failed to delete cache:', error);
    }
  };

  const handleDigUp = async (id: number) => {
    try {
      // TODO: implement digUpCache in lib/cache.ts
      await digUpCache(id);
      // update cache status in state
      setCaches(prevCaches => {
        const newCaches = [...prevCaches];
        return newCaches.map(cache => 
          cache.id === id ? { ...cache, status: 'discovered' as const } : cache
        );
      });
    } catch (error) {
      console.error('Failed to dig up cache:', error);
    }
  };

  // if (isLoading) return <div className="p-24">loading...</div>;

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
              {Object.entries(getGroupedCaches()).map(([period, periodCaches]) => (
                periodCaches.length > 0 && (
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
                      {periodCaches.map((cache) => (
                        <TrackCard 
                          key={cache.id} 
                          cache={cache} 
                          onDelete={handleDelete}
                          onDigUp={handleDigUp}
                        />
                      ))}
                    </div>
                  </motion.div>
                )
              ))}

              {caches.length === 0 && (
                <motion.div 
                  className="text-center text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  no caches found
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </TransitionChild>
  );
} 