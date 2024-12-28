from django.db import models
from django.contrib.auth.models import User

class Track(models.Model):
    spotify_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)
    artist = models.CharField(max_length=200)
    album = models.CharField(max_length=200, blank=True)
    preview_url = models.URLField(null=True, blank=True)
    image_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['spotify_id']),
        ]

class Cache(models.Model):
    CACHE_STATUS_CHOICES = [
        ('buried', 'Buried'),
        ('discovered', 'Discovered'),
        ('favorite', 'Favorite'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    track = models.ForeignKey(Track, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=CACHE_STATUS_CHOICES, default='buried')
    cached_at = models.DateTimeField(auto_now_add=True)
    last_listened = models.DateTimeField(auto_now_add=True)
    listen_count = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['user', 'track']
        indexes = [
            models.Index(fields=['user', 'status', 'last_listened']),
        ]
