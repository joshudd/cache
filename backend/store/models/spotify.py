from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from store.services.spotify import SpotifyService

class SpotifyToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    access_token = models.TextField()
    refresh_token = models.TextField()
    expires_at = models.DateTimeField()
    
    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at
    
    def refresh(self):
        spotify = SpotifyService()
        new_token_data = spotify.refresh_token(self.refresh_token)
        
        self.access_token = new_token_data['access_token']
        self.expires_at = timezone.now() + timedelta(seconds=new_token_data['expires_in'])
        self.save()
    
    @property
    def is_valid(self) -> bool:
        # refresh if expired, return false if no refresh token
        if self.is_expired and self.refresh_token:
            self.refresh()
            return True
        return not self.is_expired
    
    def get_valid_access_token(self) -> str:
        # auto refresh and return access token
        if self.is_expired:
            self.refresh()
        return self.access_token

class SpotifyPlaylistSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    playlist_id = models.CharField(max_length=255)
    playlist_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'spotify_playlist_settings'
