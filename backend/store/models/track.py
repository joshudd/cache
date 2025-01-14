from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class TrackMetadata(models.Model):
    spotify_id = models.CharField(max_length=255, db_index=True)
    title = models.CharField(max_length=255)
    artist = models.CharField(max_length=255)
    album = models.CharField(max_length=255)
    preview_url = models.URLField(null=True, blank=True)
    image_url = models.URLField()
    release_date = models.CharField(max_length=10, blank=True)  # format: YYYY-MM-DD

    class Meta:
        db_table = 'track_metadata'
        indexes = [
            models.Index(fields=['spotify_id']),
        ]

class Track(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),       # being added
        ('pending', 'Pending'),     # waiting period
        ('available', 'Available'), # can be revealed
        ('revealed', 'Revealed'),   # accessed
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    metadata = models.ForeignKey(TrackMetadata, on_delete=models.PROTECT)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    locked_at = models.DateTimeField(null=True)
    available_at = models.DateTimeField(null=True)
    revealed_at = models.DateTimeField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    played_at = models.DateTimeField(null=True)  # when the track was last played on spotify
    
    class Meta:
        db_table = 'tracks'
        unique_together = ['user', 'metadata']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['metadata']),
        ] 