"use client";

import { useEffect, useState } from "react";
import { getAllCaches, deleteCache, onCacheUpdate, digUpCache } from "@/lib/cache";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import TransitionChild from "@/components/transition/transition-child";
import { cn } from "@/lib/utils";

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
    <div className={cn(
      "group bg-dark-grey rounded-lg overflow-hidden border-2 border-transparent transition-all duration-200",
      {
        "hover:border-primary": cache.status === 'buried',
        "hover:border-purple-500": cache.status === 'discovered',
        "hover:border-yellow-500": cache.status === 'favorite'
      }
    )}>
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 flex-shrink-0">
          <img
            src={cache.image_url ?? "/placeholder-album.jpg"}
            alt={`${cache.title} album art`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 py-2">
          <p className="font-medium text-xs truncate">
            {cache.title}
          </p>
          <p className="text-xs text-light-grey truncate">
            {cache.artist}
          </p>
          <p className="text-xs text-light-grey/60 truncate">
            {cache.album}
            {cache.release_date && (
              <span className="text-light-grey/40"> • {cache.release_date.split('-')[0]}</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4">
          {cache.status === 'buried' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDigUp(cache.id)}
              className="text-primary hover:text-primary hover:bg-primary/10"
            >
              dig up early
            </Button>
          )}
          {cache.status === 'discovered' && (
            <div className="text-xs text-purple-500 px-2">discovered</div>
          )}
          {cache.status === 'favorite' && (
            <div className="text-xs text-yellow-500 px-2">favorite</div>
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
    </div>
  );
}

export default function HistoryPage() {
  const [caches, setCaches] = useState<GroupedCaches>({});
  const [isLoading, setIsLoading] = useState(true);

  // fetch and group caches by month
  const fetchCaches = async () => {
    try {
      const data = await getAllCaches();
      console.log('Cache data:', data); // debug log
      // group by month
      const grouped = data.reduce((acc: GroupedCaches, cache: Cache) => {
        const monthYear = format(new Date(cache.cached_at), 'MMMM yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(cache);
        return acc;
      }, {});
      setCaches(grouped);
    } catch (error) {
      console.error('failed to fetch caches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaches();
    // subscribe to cache updates
    const unsubscribe = onCacheUpdate(fetchCaches);
    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteCache(id);
      // update state by removing the deleted cache
      setCaches(prevCaches => {
        const newCaches = { ...prevCaches };
        Object.keys(newCaches).forEach(month => {
          newCaches[month] = newCaches[month].filter(cache => cache.id !== id);
          // remove month if empty
          if (newCaches[month].length === 0) {
            delete newCaches[month];
          }
        });
        return newCaches;
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
        const newCaches = { ...prevCaches };
        Object.keys(newCaches).forEach(month => {
          newCaches[month] = newCaches[month].map(cache => 
            cache.id === id ? { ...cache, status: 'discovered' as const } : cache
          );
        });
        return newCaches;
      });
    } catch (error) {
      console.error('Failed to dig up cache:', error);
    }
  };

  if (isLoading) return <div className="p-24">loading...</div>;

  return (
    <TransitionChild id="history">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <PageBreadcrumb />
          <div className="flex flex-col gap-16 mt-8">
            {Object.entries(caches).map(([month, monthCaches]) => (
              <div key={month} className="mb-12">
                <h2 className="text-xl font-semibold mb-4">{month}</h2>
                <div className="grid grid-cols-1 gap-4">
                  {monthCaches.map((cache) => (
                    <TrackCard 
                      key={cache.id} 
                      cache={cache} 
                      onDelete={handleDelete}
                      onDigUp={handleDigUp}
                    />
                  ))}
                </div>
              </div>
            ))}

            {Object.keys(caches).length === 0 && (
              <div className="text-center text-muted-foreground">
                no caches found
              </div>
            )}
          </div>
        </div>
      </div>
    </TransitionChild>
  );
} 