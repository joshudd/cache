import { Trash2 } from "lucide-react";

export default function VaultInfoTip() {
  return (
    <div className="relative group">
      <button className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 border border-white/20 hover:border-white/30 rounded-full transition-all">
        ?
      </button>
      
      <div className="absolute right-0 top-full mt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="rounded-lg p-6 bg-dark-grey shadow-lg w-[400px]">
          <h3 className="font-medium mb-4 text-white/70">track statuses</h3>
          <ul className="text-sm text-white/70 space-y-4">
            <li className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-500/90">sealed</div>
              <span>track is aging like fine wine, waiting to be ready</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-200/10 text-green-200/90">ready</div>
              <span>track has aged 30 days and is ready to be unearthed</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/10 text-yellow-500/90">unearthed</div>
              <span>track has been added to your playlist</span>
            </li>
          </ul>

          <h3 className="font-medium mb-4 mt-6 text-white/70">actions</h3>
          <ul className="text-sm text-white/70 space-y-4">
            <li className="flex items-center gap-3">
              <button className="text-green-200 hover:text-green-200 hover:bg-green-200/10 px-3 py-1 rounded-md text-xs">unlock early</button>
              <span>bypass the 30 day waiting period</span>
            </li>
            <li className="flex items-center gap-3">
              <button className="text-primary hover:text-primary hover:bg-primary/10 px-3 py-1 rounded-md text-xs">unearth</button>
              <span>add track to your playlist</span>
            </li>
            <li className="flex items-center gap-3">
              <button className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 rounded-md inline-flex items-center justify-center">
                <Trash2 className="h-4 w-4" />
              </button>
              <span>remove track from vault</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
} 