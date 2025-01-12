'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getUserPlaylists, getPlaylistSettings, updatePlaylistSettings } from '@/lib/spotify';
import { useToast } from '@/hooks/use-toast';

interface Playlist {
  id: string;
  name: string;
}

export default function PlaylistSelector() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // fetch playlists and current settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // get user playlists
        const data = await getUserPlaylists();
        setPlaylists(data.items.map((p: any) => ({ id: p.id, name: p.name })));

        // get current settings
        const settings = await getPlaylistSettings();
        if (settings.playlist_id) {
          setSelectedPlaylist({
            id: settings.playlist_id,
            name: settings.playlist_name
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load playlists",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePlaylistSelect = async (playlist: Playlist) => {
    try {
      await updatePlaylistSettings(playlist.id, playlist.name);
      setSelectedPlaylist(playlist);
      toast({
        title: "Success",
        description: "Playlist updated successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading playlists...</div>;

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        {selectedPlaylist 
          ? `Current playlist: ${selectedPlaylist.name}`
          : "No playlist selected"}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {playlists.map((playlist) => (
          <Button
            key={playlist.id}
            onClick={() => handlePlaylistSelect(playlist)}
            variant={selectedPlaylist?.id === playlist.id ? "default" : "outline"}
            className="w-full justify-start text-left"
          >
            {playlist.name}
          </Button>
        ))}
      </div>
    </div>
  );
} 