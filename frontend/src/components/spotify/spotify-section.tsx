'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getSpotifyStatus } from '@/lib/spotify';
import SpotifyConnectButton from './connect-button';
import PlaylistSelector from './playlist-selector';

export default function SpotifySection() {
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // check spotify connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const data = await getSpotifyStatus();
        setIsConnected(data.connected);
      } catch (error) {
        console.error('Failed to check Spotify status:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="flex flex-col gap-16">
      <section>
        <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
        <div className="flex items-center gap-4">
          <SpotifyConnectButton isConnected={isConnected} />
        </div>
      </section>

      {isConnected && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Recommendations Playlist</h2>
          <p className="text-sm text-gray-500 mb-4">
            Select a playlist where recommended songs will be added.
          </p>
          <PlaylistSelector />
        </section>
      )}
    </div>
  );
} 