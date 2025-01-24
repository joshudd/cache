from store.models.spotify import SpotifyToken
from django.utils import timezone
from store.models.track import Track
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add authentication status to response headers
        response['X-User-Authenticated'] = str(request.user.is_authenticated)
        
        return response

class SpotifyTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            try:
                token = request.user.spotifytoken
                if token.is_expired:
                    token.refresh()
            except SpotifyToken.DoesNotExist:
                pass
        return self.get_response(request)

class TrackStatusMiddleware:
    # class-level cache of last check times per user
    _last_check_times = {}
    # how often to check for updates (in seconds)
    CHECK_INTERVAL = 60  # check once per minute
    
    def __init__(self, get_response):
        self.get_response = get_response
        logger.info("TrackStatusMiddleware initialized")

    def __call__(self, request):
        if hasattr(request, 'user') and request.user.is_authenticated:
            now = timezone.now()
            user_id = request.user.id
            
            # check if we need to process updates for this user
            last_check = self._last_check_times.get(user_id)
            if not last_check or (now - last_check) > timedelta(seconds=self.CHECK_INTERVAL):
                logger.info(f"Checking updates for user {user_id}")
                
                # get all pending tracks that should be available in a single query
                tracks_to_update = Track.objects.filter(
                    user=request.user,
                    status='pending',
                    available_at__lte=now
                )
                
                count = tracks_to_update.count()
                if count > 0:
                    logger.info(f"Found {count} tracks to update")
                    # use bulk update for better performance
                    tracks_to_update.update(status='available')
                    logger.info(f"Updated {count} tracks to available")
                else:
                    logger.debug("No tracks to update")  # changed to debug level
                
                # update last check time
                self._last_check_times[user_id] = now
            else:
                logger.debug(f"Skipping check for user {user_id}, last check was {(now - last_check).total_seconds():.1f}s ago")
        
        return self.get_response(request)
