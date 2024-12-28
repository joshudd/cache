from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.middleware.csrf import get_token

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            login(request, user)
            return Response({
                'detail': 'Successfully logged in',
                'user': {
                    'username': user.username,
                    'email': user.email
                }
            })
        else:
            return Response(
                {'detail': 'Invalid credentials'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    except User.DoesNotExist:
        return Response(
            {'detail': 'User not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'detail': 'Successfully logged out'})

@api_view(['GET'])
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})
