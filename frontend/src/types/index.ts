export interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    genre?: string;
    rating?: number;
    dateAdded: Date;
    lastPlayed?: Date;
    notes?: string;
  }
  
  export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: Date;
  }