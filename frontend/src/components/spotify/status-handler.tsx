'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';

export default function StatusHandler() {
  const { toast } = useToast();
  const searchParams = useSearchParams();

  useEffect(() => {
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

  return null; // this component only handles side effects
} 