"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  getUserPlaylists,
  getPlaylistSettings,
  updatePlaylistSettings,
  createPlaylist,
} from "@/lib/spotify";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Settings2, Search, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

interface Playlist {
  id: string;
  name: string;
  images: { url: string }[];
}

export default function PlaylistSelector() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const { toast } = useToast();

  // fetch playlists and current settings
  useEffect(() => {
    const fetchData = async () => {
      try {
        // get user playlists
        const data = await getUserPlaylists();
        setPlaylists(
          data.items.map((p: Playlist) => ({
            id: p.id,
            name: p.name,
            images: p.images || [],
          }))
        );

        // get current settings
        const settings = await getPlaylistSettings();
        if (settings.playlist_id) {
          const playlist = data.items.find(
            (p: Playlist) => p.id === settings.playlist_id
          );
          if (playlist) {
            setSelectedPlaylist({
              id: playlist.id,
              name: playlist.name,
              images: playlist.images || [],
            });
          }
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load playlists",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const handlePlaylistSelect = async (playlist: Playlist) => {
    try {
      await updatePlaylistSettings(playlist.id, playlist.name);
      setSelectedPlaylist(playlist);
      setOpen(false);
      toast({
        title: "Success",
        description: "Playlist updated successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update playlist",
        variant: "destructive",
      });
    }
  };

  const handleRemovePlaylist = async () => {
    try {
      await updatePlaylistSettings("", "");
      setSelectedPlaylist(null);
      toast({
        title: "Success",
        description: "Playlist removed successfully",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to remove playlist",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a playlist name",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPlaylist = await createPlaylist(newPlaylistName.trim());
      setPlaylists([newPlaylist, ...playlists]);
      await handlePlaylistSelect(newPlaylist);
      setShowCreateDialog(false);
      setNewPlaylistName("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to create playlist",
        variant: "destructive",
      });
    }
  };

  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading playlists...</div>;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {selectedPlaylist && selectedPlaylist.images[0] && (
          <Image
            src={selectedPlaylist.images[0].url}
            alt={selectedPlaylist.name}
            className="w-6 h-6 rounded object-cover"
            width={24}
            height={24}
          />
        )}
        <div className="text-sm">
          {selectedPlaylist ? selectedPlaylist.name : "No playlist selected"}
        </div>
      </div>
      {selectedPlaylist && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleRemovePlaylist}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Playlist</DialogTitle>
            <DialogDescription>
              Select a playlist to use for your vault or create a new one
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search playlists..."
                className="pl-9"
              />
            </div>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" /> New Playlist
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-1 pt-4 max-h-[60vh] overflow-y-auto">
            {filteredPlaylists.map((playlist) => (
              <Button
                key={playlist.id}
                onClick={() => handlePlaylistSelect(playlist)}
                variant={
                  selectedPlaylist?.id === playlist.id ? "default" : "outline"
                }
                className="w-full h-10 flex flex-row items-center gap-3 justify-start px-3"
              >
                {playlist.images[0] ? (
                  <Image
                    src={playlist.images[0].url}
                    alt={playlist.name}
                    className="w-6 h-6 rounded object-cover flex-shrink-0"
                    width={24}
                    height={24}
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs">?</span>
                  </div>
                )}
                <span className="text-sm truncate">{playlist.name}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
            <DialogDescription>
              Enter a name to create a new Spotify playlist
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreatePlaylist();
                }
              }}
              className="hover:placeholder:text-primary transition-colors"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePlaylist}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
