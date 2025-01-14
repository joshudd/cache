from store.models.spotify import SpotifyToken

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
