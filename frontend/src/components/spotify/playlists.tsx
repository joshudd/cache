import { useState, useEffect } from 'react';
import { getUserPlaylists } from '@/lib/spotify';
import Image from 'next/image';

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
  tracks: { total: number };
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const data = await getUserPlaylists();
        setPlaylists(data.items);
      } catch (err) {
        setError('Failed to load playlists');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  if (loading) return <div>Loading playlists...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {playlists.map((playlist) => (
        <div 
          key={playlist.id}
          className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
        >
          {playlist.images[0] && (
            <Image
              src={playlist.images[0].url} 
              alt={playlist.name}
              className="w-full h-48 object-cover rounded-md mb-2"
              width={24}
              height={24}
            />
          )}
          <h3 className="font-semibold text-lg">{playlist.name}</h3>
          <p className="text-gray-600">{playlist.tracks.total} tracks</p>
        </div>
      ))}
    </div>
  );
}