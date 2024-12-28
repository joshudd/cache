import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { toast } from "@/hooks/use-toast"

const SUGGESTIONS = [
  { title: "Hurt", artist: "Arlo Parks" },
  { title: "Sometimes", artist: "Faye Webster" },
  { title: "Your Face", artist: "Wisp" },
  { title: "projections", artist: "Night Tapes" },
];

export default function Suggestions() {
  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((track) => (
          <Track key={`${track.title}-${track.artist}`} title={track.title} artist={track.artist} />
        ))}
      </div>
    </div>
  );
}

function Track({ title, artist }: { title: string; artist: string }) {
  return (
    <div className="group bg-dark-grey rounded-lg pl-4 pr-2 py-2 flex items-center justify-between gap-2 w-fit h-fit">
      <div className="min-w-0 p">
        <p className="text-base font-medium line-clamp-2">{title}</p>
        <p className="text-sm text-muted-foreground line-clamp-1">by {artist}</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        className="h-12 w-8 shrink-0 hover:bg-primary/10 transition-colors"
        onClick={() => toast({ title: `cached "${title}" by ${artist}.` })}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
