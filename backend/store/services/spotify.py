from typing import Dict
import requests
from django.conf import settings
import os
from urllib.parse import urlencode

class SpotifyService:
    BASE_URL = 'https://api.spotify.com/v1'
    AUTH_URL = 'https://accounts.spotify.com/api/token'
    AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize'

    def __init__(self, access_token: str = None):
        self.access_token = access_token
        self.client_id = settings.SPOTIFY_CLIENT_ID
        self.client_secret = settings.SPOTIFY_CLIENT_SECRET
        self.redirect_uri = settings.SPOTIFY_REDIRECT_URI

    def get_auth_url(self) -> str:
        """Get Spotify OAuth URL."""
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'redirect_uri': self.redirect_uri,
            'scope': 'user-library-read playlist-read-private playlist-modify-public playlist-modify-private user-top-read user-read-recently-played',
            'state': 'spotify_auth',
            'show_dialog': 'true'  # force spotify to show login dialog
        }
        return f'{self.AUTH_ENDPOINT}?{urlencode(params)}'

    @staticmethod
    def exchange_code(code: str) -> Dict:
        response = requests.post(
            SpotifyService.AUTH_URL,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': settings.SPOTIFY_REDIRECT_URI,
                'client_id': settings.SPOTIFY_CLIENT_ID,
                'client_secret': settings.SPOTIFY_CLIENT_SECRET,
            }
        )
        if not response.ok:
            print(f"Spotify token exchange error: {response.text}")
        return response.json()

    def search_tracks(self, query: str, limit: int = 15) -> Dict:
        response = requests.get(
            f'{self.BASE_URL}/search',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={'q': query, 'type': 'track', 'limit': limit}
        )
        return response.json()

    def get_user_playlists(self) -> Dict:
        response = requests.get(
            f'{self.BASE_URL}/me/playlists',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={'limit': 50}  # adjust limit as needed
        )
        if not response.ok:
            raise Exception(f"Failed to fetch playlists: {response.text}")
        return response.json()

    def refresh_token(self, refresh_token: str) -> Dict:
        response = requests.post(
            self.AUTH_URL,
            data={
                'grant_type': 'refresh_token',
                'refresh_token': refresh_token,
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            }
        )
        if not response.ok:
            print(f"Spotify token refresh error: {response.text}")
            raise Exception('Failed to refresh token')
        return response.json()

    def get_playlist_tracks(self, playlist_id: str) -> Dict:
        response = requests.get(
            f'{self.BASE_URL}/playlists/{playlist_id}/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={'limit': 50}  # adjust limit as needed
        )
        if not response.ok:
            raise Exception(f"Failed to fetch playlist tracks: {response.text}")
        return response.json()

    def get_user_top_tracks(self, limit: int = 20) -> Dict:
        """Get user's top tracks."""
        response = requests.get(
            f'{self.BASE_URL}/me/top/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={
                'limit': limit,
                'time_range': 'medium_term'
            }
        )
        if not response.ok:
            raise Exception(f"Failed to fetch top tracks: {response.text}")
        return response.json()

    def get_user_saved_tracks(self, limit: int = 20) -> Dict:
        """Get user's saved tracks as fallback."""
        response = requests.get(
            f'{self.BASE_URL}/me/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={'limit': limit}
        )
        if not response.ok:
            raise Exception(f"Failed to fetch saved tracks: {response.text}")
        return response.json()

    def get_recommendations(self, seed_tracks: list, limit: int = 20) -> Dict:
        """Get recommendations based on seed tracks."""
        response = requests.get(
            f'{self.BASE_URL}/recommendations',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={
                'seed_tracks': ','.join(seed_tracks[:3]),  # spotify limit
                'limit': limit
            }
        )
        if not response.ok:
            raise Exception(f"Failed to fetch recommendations: {response.text}")
        return response.json()

    def get_recently_played(self, limit: int = 6) -> Dict:
        """get user's recently played tracks"""
        response = requests.get(
            f'{self.BASE_URL}/me/player/recently-played',
            headers={'Authorization': f'Bearer {self.access_token}'},
            params={'limit': limit}
        )
        if not response.ok:
            raise Exception(f"failed to fetch recent tracks: {response.text}")
        return response.json()

    def get_access_token(self, code: str) -> Dict:
        """Exchange code for tokens."""
        response = requests.post(
            self.AUTH_URL,
            data={
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.redirect_uri,
                'client_id': self.client_id,
                'client_secret': self.client_secret,
            }
        )
        
        if not response.ok:
            raise Exception(f"Failed to get access token: {response.text}")
        
        return response.json()

    def add_tracks_to_playlist(self, playlist_id: str, track_uris: list) -> Dict:
        """Add tracks to a playlist."""
        response = requests.post(
            f'{self.BASE_URL}/playlists/{playlist_id}/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'},
            json={'uris': [f'spotify:track:{track_id}' for track_id in track_uris]}
        )
        if not response.ok:
            raise Exception(f"Failed to add tracks to playlist: {response.text}")
        return response.json()

    def remove_tracks_from_playlist(self, playlist_id: str, track_uris: list) -> Dict:
        """Remove tracks from a playlist."""
        response = requests.delete(
            f'{self.BASE_URL}/playlists/{playlist_id}/tracks',
            headers={'Authorization': f'Bearer {self.access_token}'},
            json={'tracks': [{'uri': f'spotify:track:{track_id}'} for track_id in track_uris]}
        )
        if not response.ok:
            raise Exception(f"Failed to remove tracks from playlist: {response.text}")
        return response.json()

    def create_playlist(self, name: str = "My Vault Playlist") -> Dict:
        """Create a new playlist for the user."""
        # get user id first
        user_response = requests.get(
            f'{self.BASE_URL}/me',
            headers={'Authorization': f'Bearer {self.access_token}'}
        )
        if not user_response.ok:
            raise Exception(f"Failed to get user info: {user_response.text}")
        user_id = user_response.json()['id']

        # create playlist
        response = requests.post(
            f'{self.BASE_URL}/users/{user_id}/playlists',
            headers={'Authorization': f'Bearer {self.access_token}'},
            json={
                'name': name,
                'description': 'Created by Vault - Your personal music time capsule',
                'public': False
            }
        )
        if not response.ok:
            raise Exception(f"Failed to create playlist: {response.text}")
        return response.json()

    def get_track(self, track_id: str) -> Dict:
        """get track metadata by id"""
        try:
            response = requests.get(
                f'{self.BASE_URL}/tracks/{track_id}',
                headers={'Authorization': f'Bearer {self.access_token}'}
            )
            if not response.ok:
                raise Exception(f"failed to fetch track: {response.status_code} - {response.text}")
            return response.json()
        except Exception as e:
            raise Exception(f"failed to fetch track: {str(e)}")
    