"use client";

import { useEffect, useState } from "react";
import { getAllCaches, deleteCache } from "@/lib/cache";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Cache {
  id: number;
  title: string;
  artist: string;
  album?: string;
  image_url?: string;
  cached_at: string;
  status: 'buried' | 'discovered' | 'favorite';
}

interface GroupedCaches {
  [key: string]: Cache[];
}

export default function HistoryPage() {
  const [caches, setCaches] = useState<GroupedCaches>({});
  const [isLoading, setIsLoading] = useState(true);

  // fetch and group caches by month
  useEffect(() => {
    const fetchCaches = async () => {
      try {
        const data = await getAllCaches();
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
        console.error('Failed to fetch caches:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCaches();
  }, []);

  const handleDelete = async (id: number) => {
    // if (!confirm('are you sure you want to delete this cache?')) return;
    
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

  if (isLoading) return <div className="p-24">loading...</div>;

  return (
    <div className="p-24">
      <h1 className="text-2xl font-bold mb-8">cache history</h1>
      
      {Object.entries(caches).map(([month, monthCaches]) => (
        <div key={month} className="mb-12">
          <h2 className="text-xl font-semibold mb-4">{month}</h2>
          <div className="grid grid-cols-1 gap-4">
            {monthCaches.map((cache) => (
              <div key={cache.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  {cache.image_url && (
                    <img src={cache.image_url} alt={cache.title} className="w-12 h-12 rounded" />
                  )}
                  <div>
                    <div className="font-medium">{cache.title}</div>
                    <div className="text-sm text-muted-foreground">{cache.artist}</div>
                    {cache.album && (
                      <div className="text-sm text-muted-foreground">{cache.album}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cache.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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
  );
} 