"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "@/lib/auth";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import TrackSearch from "../spotify/track-search";

export default function Navbar() {
  const router = useRouter();
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

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const profile_dropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger>account</DropdownMenuTrigger>
      <DropdownMenuContent className="">
        <DropdownMenuLabel>
          {username ? `${username}` : "my account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account/profile">
            <User /> profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
          <LogOut /> sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="fixed flex justify-between items-center py-8 px-16 w-full">
      <div className="font-bold text-md hover:underline">
        <Link href="/dashboard">cache</Link>
      </div>

      <div className="space-x-8 text-sm flex items-center gap-4">
        <TrackSearch />
        <div className="flex items-center gap-4">
          <Link href="/history" className="hover:underline">
            history
          </Link>
          {profile_dropdown}
        </div>
      </div>
    </nav>
  );
}
