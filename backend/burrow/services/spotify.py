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
            'scope': 'user-library-read playlist-read-private user-top-read user-read-recently-played',
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
            params={'limit': 50}  # Adjust limit as needed
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
    