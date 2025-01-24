from django.contrib.auth import login, logout
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from store.models.spotify import SpotifyToken

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            login(request, user)
            
            # get user data including spotify connection status
            user_data = {
                'username': user.username,
                'email': user.email,
                'spotify_connected': SpotifyToken.objects.filter(user=user).exists()
            }
            
            return Response({
                'detail': 'Successfully logged in',
                'user': user_data
            })
            
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
@ensure_csrf_cookie
def logout_view(request):
    logout(request)
    return Response({'detail': 'Successfully logged out'})

@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf_token(request):
    return Response({'csrfToken': get_token(request)})

@api_view(['POST'])
def signup_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    if User.objects.filter(username=username).exists():
        return Response(
            {'detail': 'Username already exists'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return Response({
            'detail': 'User created successfully',
            'user': {
                'username': user.username,
                'email': user.email,
                'spotify_connected': False
            }
        })
    except Exception as e:
        return Response(
            {'detail': f'Failed to create user: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    # get user data including spotify connection status
    return Response({
        'username': request.user.username,
        'email': request.user.email,
        'spotify_connected': SpotifyToken.objects.filter(user=request.user).exists()
    }) 