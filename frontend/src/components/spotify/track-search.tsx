'use client';

import { useState } from 'react';
import { searchTracks } from '@/lib/spotify';
import { Track } from '@/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

export default function TrackSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const data = await searchTracks(query);
      setResults(data.tracks.items);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for tracks..."
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          Search
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {results.map((track) => (
          //   <TrackResult key={track.id} track={track} />
          <div key={track.id}>{track.title}</div>
        ))}
      </div>
    </div>
  );
} 