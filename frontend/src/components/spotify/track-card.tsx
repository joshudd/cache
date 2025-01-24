import { cn } from "@/lib/utils";
import { Track } from "@/types";
import { motion } from "framer-motion";
import Image from "next/image"; 

interface TrackCardProps {
  track: Track;
  index: number;
  isLocked: boolean;
  onLock: (track: Track) => void;
}

// track card component for search results
export function TrackCard({ track, index, isLocked, onLock }: TrackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.2,
        delay: index * 0.05,
        ease: "easeOut",
      }}
    >
      <button
        onClick={() => onLock(track)}
        className="group relative hover:z-10 w-full"
      >
        <div className="absolute -top-4 left-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className={cn(
              "text-xs text-black font-medium px-3 py-0.5 rounded-tr-md shadow-sm",
              isLocked ? "bg-purple-500" : "bg-primary"
            )}
          >
            {isLocked ? "sealed" : "seal"}
          </div>
        </div>
        <div
          className={cn(
            "bg-dark-grey rounded-lg overflow-hidden group-hover:rounded-tl-none group-hover:border-2 group-hover:m-1 transition-all duration-200 flex",
            isLocked
              ? "group-hover:border-purple-500"
              : "group-hover:border-primary"
          )}
        >
          <div className={cn("flex flex-1", isLocked && "opacity-50")}>
            <div className="w-16 flex-shrink-0">
              <Image 
                src={track?.metadata?.image_url ?? "/placeholder-album.jpg"}
                alt={`${track?.metadata?.title || "Track"} album art`}
                className="h-full w-full object-cover"
                width={64}
                height={64}
              />
            </div>
            <div className="flex-1 min-w-0 py-2 px-4 text-left">
              <p className="font-medium text-xs group-hover:whitespace-normal group-hover:break-all group-hover:hyphens-auto truncate">
                {track?.metadata?.title || "Unknown Track"}
              </p>
              <p className="text-xs text-light-grey group-hover:whitespace-normal group-hover:break-all group-hover:hyphens-auto truncate">
                {track?.metadata?.artist || "Unknown Artist"}
              </p>
              <p className="text-xs text-light-grey/60 group-hover:whitespace-normal group-hover:break-all group-hover:hyphens-auto truncate">
                {track?.metadata?.album || "Unknown Album"}
                {track?.metadata?.release_date && (
                  <span className="text-light-grey/40">
                    {" "}
                    • {track.metadata.release_date.split("-")[0]}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
