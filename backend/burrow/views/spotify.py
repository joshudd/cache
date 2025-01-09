from django.utils import timezone
from django.utils.timezone import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from burrow.services.spotify import SpotifyService
from burrow.models.spotify import SpotifyToken
import requests
from django.conf import settings

@api_view(['GET'])
@permission_classes([AllowAny])  # allow unauthenticated access to get auth url
def get_auth_url(request):
    # get spotify auth url for user to connect their account
    spotify = SpotifyService()
    auth_url = spotify.get_auth_url()
    return Response({'auth_url': auth_url})

@api_view(['POST'])
@permission_classes([AllowAny])  # allow unauthenticated for initial connection
def callback(request):
    # handle spotify oauth callback
    code = request.data.get('code')
    
    if not code:
        return Response(
            {'detail': 'Code is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # exchange code for tokens
        spotify = SpotifyService()
        token_data = spotify.get_access_token(code)
        
        if not request.user.is_authenticated:
            # store tokens in session if user not logged in
            request.session['spotify_token_data'] = {
                'access_token': token_data['access_token'],
                'refresh_token': token_data['refresh_token'],
                'expires_in': token_data['expires_in']
            }
            return Response({'detail': 'Token stored in session'})
        
        # save tokens to database if user is logged in
        SpotifyToken.objects.update_or_create(
            user=request.user,
            defaults={
                'access_token': token_data['access_token'],
                'refresh_token': token_data['refresh_token'],
                'expires_at': timezone.now() + timedelta(seconds=token_data['expires_in'])
            }
        )
        
        return Response({'detail': 'Spotify connected successfully'})
        
    except Exception as e:
        print(f"Spotify callback error: {str(e)}")  # debug log
        return Response(
            {'detail': f'Failed to connect Spotify: {str(e)}'}, 
            status=status.HTTP_400_BAD_REQUEST
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connection_status(request):
    # check if user has connected spotify
    token = SpotifyToken.objects.filter(user=request.user).first()
    
    if not token:
        return Response({'connected': False})
        
    # refresh token if expired
    if token.is_expired:
        try:
            token.refresh()
        except Exception:
            # if refresh fails, delete token and return not connected
            token.delete()
            return Response({'connected': False})
    
    return Response({
        'connected': True,
        'expires_at': token.expires_at
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_playlists(request):
    try:
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        spotify = SpotifyService(token.access_token)
        playlists = spotify.get_user_playlists()
        return Response(playlists)
        
    except SpotifyToken.DoesNotExist:
        return Response(
            {'detail': 'Spotify not connected'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    except Exception as e:
        return Response(
            {'detail': f'Failed to fetch playlists: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_unique_recommendations(request):
    try:
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        spotify = SpotifyService(token.access_token)
        
        # start with getting user's top tracks for seeds
        try:
            top_tracks = spotify.get_user_top_tracks(limit=5)
            
            # fallback to getting saved tracks if no top tracks
            if not top_tracks['items']:
                saved_tracks = spotify.get_user_saved_tracks(limit=5)
                seed_tracks = [track['track']['id'] for track in saved_tracks['items'][:5]]
            else:
                seed_tracks = [track['id'] for track in top_tracks['items'][:5]]
            
            if not seed_tracks:
                return Response(
                    {'detail': 'No seed tracks found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # get recommendations based on seeds
            recommendations = spotify.get_recommendations(
                seed_tracks=seed_tracks[:3],
                limit=20
            )
            
            # format the response
            unique_recommendations = [
                {
                    'id': track['id'],
                    'name': track['name'],
                    'artist': track['artists'][0]['name'],
                    'albumArt': track['album']['images'][0]['url'] if track['album']['images'] else None
                }
                for track in recommendations['tracks']
            ]
            
            return Response(unique_recommendations)
            
        except Exception as e:
            return Response(
                {'detail': f'Spotify API error: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    except SpotifyToken.DoesNotExist:
        return Response(
            {'detail': 'Spotify not connected'}, 
            status=status.HTTP_403_FORBIDDEN
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def spotify_disconnect(request):
    try:
        # get token before deletion
        token = SpotifyToken.objects.get(user=request.user)
        
        # revoke spotify access
        requests.post('https://accounts.spotify.com/api/token/revoke', data={
            'token': token.access_token,
            'client_id': settings.SPOTIFY_CLIENT_ID,
            'client_secret': settings.SPOTIFY_CLIENT_SECRET,
        })
        
        # delete token from database
        token.delete()
        return Response({'detail': 'Spotify disconnected successfully'})
        
    except SpotifyToken.DoesNotExist:
        return Response({'detail': 'No Spotify connection found'})
    except Exception as e:
        return Response(
            {'detail': f'Failed to disconnect Spotify: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
