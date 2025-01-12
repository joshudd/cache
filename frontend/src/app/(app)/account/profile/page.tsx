"use client";

import TransitionChild from '@/components/transition/transition-child';
import PageBreadcrumb from '@/components/ui/page-breadcrumb';
import SpotifySection from '@/components/spotify/spotify-section';
import StatusHandler from '@/components/spotify/status-handler';

export default function Profile() {
  return (
    <TransitionChild id="profile">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <PageBreadcrumb />
          <StatusHandler />
          <div className="mt-8">
            <SpotifySection />
          </div>
        </div>
      </div>
    </TransitionChild>
  );
}
