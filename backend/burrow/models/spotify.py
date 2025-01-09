from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from burrow.services.spotify import SpotifyService

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
