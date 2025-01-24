from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from store.models.track import Track

class TrackService:
    @staticmethod
    def get_revealed_tracks(user):
        """get tracks that were revealed recently"""
        revealed = Track.objects.filter(
            user=user,
            status='revealed'
        ).select_related('metadata').order_by('-revealed_at')[:10]
        
        return [
            {
                'id': track.metadata.spotify_id,
                'title': track.metadata.title,
                'artist': track.metadata.artist,
                'album': track.metadata.album,
                'image': track.metadata.image_url,
                'preview_url': track.metadata.preview_url,
                'release_date': track.metadata.release_date,
                'revealed_at': track.revealed_at
            }
            for track in revealed
        ]

    @staticmethod
    def get_available_tracks(user):
        """get tracks that are available to reveal"""
        # get locked time settings
        locked_time = (
            timedelta(days=settings.TRACK_SETTINGS['DEVELOPMENT_LOCK_DAYS'])
            if settings.TRACK_SETTINGS['DEVELOPMENT_MODE']
            else timedelta(weeks=settings.TRACK_SETTINGS['PRODUCTION_LOCK_WEEKS'])
        )
        
        now = timezone.now()
        cutoff_time = now - locked_time

        available_tracks = Track.objects.filter(
            user=user,
            status='available',
            available_at__lte=now
        ).select_related('metadata').order_by('available_at')[:10]

        return {    
            'tracks': [
                {
                    'id': track.id,
                    'spotify_id': track.metadata.spotify_id,
                    'title': track.metadata.title,
                    'artist': track.metadata.artist,
                    'album': track.metadata.album,
                    'image': track.metadata.image_url,
                    'preview_url': track.metadata.preview_url,
                    'release_date': track.metadata.release_date,
                    'status': track.status,
                    'available_at': track.available_at,
                    'revealed_at': track.revealed_at,
                    'created_at': track.created_at,
                    'available_days': (now - track.available_at).days,
                    'hours_until_ready': max(0, round((cutoff_time - track.available_at).total_seconds() / 3600, 1))
                }
                for track in available_tracks
            ],
            'locked_time': {
                'days': locked_time.days,
                'development_mode': settings.TRACK_SETTINGS['DEVELOPMENT_MODE']
            }
        }