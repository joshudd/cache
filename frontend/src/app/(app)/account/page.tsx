"use client";

import TransitionChild from "@/components/transition/transition-child";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import SpotifySection from "@/components/spotify/spotify-section";
import StatusHandler from "@/components/spotify/status-handler";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function Account() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <TransitionChild id="account">
      <div className="flex justify-center w-full p-8 pt-16 pb-20 sm:p-20 sm:pt-20">
        <div className="w-full max-w-3xl overflow-hidden relative">
          <PageBreadcrumb />
          <StatusHandler />
          <div className="mt-8 pt-8 border-t border-dark-grey">
            <SpotifySection />
          </div>

          <div className="mt-16 pt-8 border-t border-dark-grey">
            <h2 className="text-lg font-medium mb-4">sign out</h2>
            <Button
              variant="destructive"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              sign out
            </Button>
          </div>
        </div>
      </div>
    </TransitionChild>
  );
}
