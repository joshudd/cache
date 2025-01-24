"use client";

import { useState } from "react";

// info tip for new users about track flow
export default function InfoTip() {
  return (
    <div className="relative group">
      <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 border border-white/20 hover:border-white/30 rounded-full transition-all">
        ?
      </button>
      
      <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
        <div className="rounded-lg p-6 bg-dark-grey shadow-lg w-[400px]">
          <h3 className="font-medium mb-4 text-white/70">how it works</h3>
          <ul className="text-sm text-white/70 space-y-3">
            <li className="flex gap-3">
              <span className="text-grey">1.</span>
              <span>tracks you listen to on spotify appear in &quot;recently played&quot;</span>
            </li>
            <li className="flex gap-3">
              <span className="text-grey">2.</span>
              <span>seal tracks you want to save for a future playlist</span>
            </li>
            <li className="flex gap-3">
              <span className="text-grey">3.</span>
              <span>sealed tracks become &quot;ready&quot; after 30 days</span>
            </li>
            <li className="flex gap-3">
              <span className="text-grey">4.</span>
              <span>create playlists from your ready tracks</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 