"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed flex justify-between items-center p-8 w-full">
      <div className="font-bold text-md hover:underline">
        <Link href="/">cache</Link>
      </div>

      <div className="space-x-4 text-sm">
        <Link href="/history" className="hover:underline">
          history
        </Link>
        <Link href="/settings" className="hover:underline">
          settings
        </Link>
        <Link href="/profile" className="hover:underline">
          profile
        </Link>
      </div>
    </nav>
  );
}
