from django.core.management.base import BaseCommand
from django.utils import timezone
from store.models.track import Track

class Command(BaseCommand):
    help = 'Update track statuses based on available_at dates'

    def handle(self, *args, **options):
        now = timezone.now()
        
        # find pending tracks that should be available
        updated = Track.objects.filter(
            status='pending',
            available_at__lte=now
        ).update(status='available')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated} tracks to available')
        ) 