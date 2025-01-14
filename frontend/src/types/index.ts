export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface TrackMetadata {
  spotify_id: string;
  title: string;
  artist: string;
  album: string;
  preview_url?: string;
  image_url: string;
  release_date: string;
}

export interface Track {
  id: number;
  metadata: TrackMetadata;
  status: 'active' | 'pending' | 'available' | 'revealed';
  locked_at?: string;
  available_at?: string;
  revealed_at?: string;
  created_at: string;
  played_at?: string;
} 