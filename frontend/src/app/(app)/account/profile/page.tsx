"use client";

import { useEffect, useState } from "react";
import TransitionChild from "@/components/transition/transition-child";
import SpotifyConnectButton from '@/components/spotify/connect-button';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'next/navigation';
import PageBreadcrumb from "@/components/ui/page-breadcrumb";

export default function Profile() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkSpotifyConnection = async () => {
      try {
        console.log("Checking Spotify connection..."); // debug
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/spotify/status`, {
          credentials: 'include',
        });
        const data = await response.json();
        console.log("Spotify connection status:", data); // debug
        setIsConnected(data.connected);
      } catch (error) {
        console.error('Failed to check Spotify status:', error);
        setIsConnected(false);
      }
    };

    // Check connection status when the page loads
    checkSpotifyConnection();

    // Also check when URL has success parameter
    if (searchParams.get('success') === 'true') {
      checkSpotifyConnection();
    }
  }, [searchParams]); // Added searchParams as dependency

  useEffect(() => {
    // Check for success/error params
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'true') {
      toast({
        title: "Success!",
        description: "Successfully connected to Spotify",
      });
    } else if (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Spotify. Please try again.",
        variant: "destructive",
      });
    }
  }, [searchParams, toast]);

  return (
    <TransitionChild id="profile">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <PageBreadcrumb />
          <div className="flex flex-col gap-16 mt-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Connected Services</h2>
              <div className="flex items-center gap-4">
                <SpotifyConnectButton isConnected={isConnected} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </TransitionChild>
  );
}
