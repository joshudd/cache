"use client";

import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { User, History, Home } from "lucide-react";
import { usePathname } from "next/navigation";
import TrackSearch from "../spotify/track-search";

export default function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setUsername(userData.username);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    }
    fetchUser();
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-background w-full border-b border-dark-grey/20">
      <div className="flex justify-between items-center py-4 max-w-3xl mx-auto px-8 sm:px-0">
        <div className="font-bold text-md pr-8">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 hover:text-primary ${
              pathname === "/dashboard" ? "text-light-grey" : "text-white"
            }`}
          >
            <Home size={16} />
            <span>cache</span>
          </Link>
        </div>

        <div className="space-x-8 text-sm flex items-center gap-4">
          <TrackSearch />
          <div className="flex items-center gap-8">
            <Link
              href="/history"
              className={`flex items-center gap-2 hover:text-primary ${
                pathname === "/history" ? "text-light-grey" : "text-white"
              }`}
            >
              <History size={16} />
              <span>history</span>
            </Link>
            <Link
              href="/account"
              className={`flex items-center gap-2 hover:text-primary ${
                pathname.startsWith("/account")
                  ? "text-light-grey"
                  : "text-white"
              }`}
            >
              <User size={16} />
              <span>account</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
