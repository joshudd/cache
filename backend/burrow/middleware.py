from django.http import JsonResponse

class AuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        
        # Add authentication status to response headers
        response['X-User-Authenticated'] = str(request.user.is_authenticated)
        
        return response
