"use client"

import { useEffect, useState } from "react"
import { getBuriedRecommendations } from "@/lib/spotify"
import { createCache } from "@/lib/cache"
import { formatDistanceToNow } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type Track = {
  id: string
  title: string
  artist: string
  album: string
  image: string | null
  preview_url: string | null
  release_date: string
}

type SeedTrack = {
  id: string
  title: string
  artist: string
  buried_at: string
}

export default function BuriedRecommendations() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [seedTracks, setSeedTracks] = useState<SeedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cachingId, setCachingId] = useState("")

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const data = await getBuriedRecommendations()
        setTracks(data.tracks)
        setSeedTracks(data.seed_tracks)
      } catch (e) {
        setError("no buried tracks found yet")
      } finally {
        setLoading(false)
      }
    }
    loadRecommendations()
  }, [])

  const cacheTrack = async (track: Track) => {
    try {
      setCachingId(track.id)
      await createCache({
        spotify_id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        image_url: track.image ?? undefined,
        release_date: track.release_date,
      })
      // remove from list after caching
      setTracks(tracks => tracks.filter(t => t.id !== track.id))
      setTimeout(() => setCachingId(""), 1000)
    } catch {
      setCachingId("")
    }
  }

  if (loading) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || tracks.length === 0) {
    return (
      <div className="border-2 border-dark-grey border-dashed rounded-lg p-4">
        <div className="text-sm text-muted-foreground">{error || "no recommendations found"}</div>
      </div>
    )
  }

  return (
    <div className="border-2 border-dark-grey border-dashed rounded-lg p-4 animate-in fade-in duration-500">
      {seedTracks.length > 0 && (
        <div className="mb-4 text-xs text-muted-foreground">
          <span>based on </span>
          {seedTracks.map((track, i) => (
            <span key={track.id}>
              <span className="text-foreground">{track.title}</span>
              <span className="text-xs"> ({formatDistanceToNow(new Date(track.buried_at), { addSuffix: true })})</span>
              {i < seedTracks.length - 1 && <span>, </span>}
            </span>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {tracks.map((track) => (
          <div key={track.id} className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
              <img
                src={track.image ?? "/placeholder-album.jpg"}
                alt={`${track.title} album art`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{track.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {track.artist}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 hover:bg-primary/80"
              onClick={() => cacheTrack(track)}
              disabled={cachingId === track.id}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 