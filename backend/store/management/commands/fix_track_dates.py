from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from store.models.track import Track

class Command(BaseCommand):
    help = 'Fix tracks with missing available_at dates'

    def handle(self, *args, **options):
        # get lock time from settings
        locked_time = (
            timedelta(days=settings.TRACK_SETTINGS['DEVELOPMENT_LOCK_DAYS'])
            if settings.TRACK_SETTINGS['DEVELOPMENT_MODE']
            else timedelta(weeks=settings.TRACK_SETTINGS['PRODUCTION_LOCK_WEEKS'])
        )
        
        # find pending tracks with no available_at
        tracks = Track.objects.filter(
            status='pending',
            available_at__isnull=True,
            locked_at__isnull=False
        )
        
        count = 0
        for track in tracks:
            track.available_at = track.locked_at + locked_time
            track.save()
            count += 1
            self.stdout.write(f"Fixed track {track.id}: available_at set to {track.available_at}")
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully fixed {count} tracks')
        ) 