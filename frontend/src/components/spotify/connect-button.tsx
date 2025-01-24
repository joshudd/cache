'use client';

import { Button } from '@/components/ui/button';
import { connectSpotify, disconnectSpotify } from '@/lib/spotify';
import { useToast } from "@/hooks/use-toast";

export default function SpotifyConnectButton({ isConnected }: { isConnected?: boolean }) {
  const { toast } = useToast();

  const handleDisconnect = async () => {
    try {
      await disconnectSpotify();
      toast({
        title: "Success",
        description: "Spotify account disconnected",
      });
      // force reload to update connection state
      window.location.reload();
    } catch (error) {
      console.error("failed to disconnect spotify:", error);
      toast({
        title: "Error",
        description: "Failed to disconnect Spotify",
        variant: "destructive",
      });
    }
  };

  if (isConnected) {
    return (
      <Button 
        onClick={handleDisconnect}
        variant="outline"
        className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
      >
        Disconnect Spotify
      </Button>
    );
  }

  return (
    <Button 
      onClick={connectSpotify}
      className="bg-[#1DB954] hover:bg-[#1ed760]"
    >
      Connect Spotify
    </Button>
  );
}
