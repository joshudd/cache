from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import ensure_csrf_cookie
from store.services.spotify import SpotifyService
from store.models.spotify import SpotifyToken, SpotifyPlaylistSettings
import requests
from django.conf import settings

SPOTIFY_NOT_CONNECTED_RESPONSE = Response(
    {'detail': 'Spotify not connected'}, 
    status=status.HTTP_403_FORBIDDEN
)

@api_view(['GET'])
@permission_classes([AllowAny])  # allow unauthenticated access to get auth url
def get_auth_url(request):
    # get spotify auth url for user to connect their account
    spotify = SpotifyService()
    auth_url = spotify.get_auth_url()
    return Response({'auth_url': auth_url})

@api_view(['POST'])
@permission_classes([AllowAny])  # allow unauthenticated for initial connection
@ensure_csrf_cookie
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
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to fetch playlists: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to disconnect Spotify: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def spotify_search(request):
    # get search query from request params
    query = request.GET.get('q')
    if not query:
        return Response(
            {'detail': 'Search query is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # get spotify token
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        # search tracks using spotify service
        spotify = SpotifyService(token.access_token)
        results = spotify.search_tracks(query)
        
        # format track results
        tracks = [
            {
                'id': 0,  # temporary id since it's not saved yet
                'metadata': {
                    'spotify_id': track['id'],
                    'title': track['name'],
                    'artist': ', '.join(artist['name'] for artist in track['artists']),
                    'album': track['album']['name'],
                    'image_url': track['album']['images'][0]['url'] if track['album']['images'] else '/placeholder-album.jpg',
                    'preview_url': track['preview_url'],
                    'release_date': track['album']['release_date']
                },
                'status': 'active'  # default status for search results
            }
            for track in results['tracks']['items']
        ]
        
        return Response({'tracks': {'items': tracks}})
        
    except SpotifyToken.DoesNotExist:
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to search tracks: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def recently_played(request):
    """get user's recently played tracks"""
    try:
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        spotify = SpotifyService(token.access_token)
        results = spotify.get_recently_played()
        
        # format track results
        tracks = [
            {
                'id': item['track']['id'],
                'title': item['track']['name'],
                'artist': item['track']['artists'][0]['name'],
                'album': item['track']['album']['name'],
                'image': item['track']['album']['images'][0]['url'] if item['track']['album']['images'] else None,
                'played_at': item['played_at'],
                'release_date': item['track']['album']['release_date']
            }
            for item in results['items']
        ]
        
        return Response({'tracks': tracks})
        
    except SpotifyToken.DoesNotExist:
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to fetch recent tracks: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def playlist_settings(request):
    """get or update playlist settings for recommendations"""
    try:
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        if request.method == 'POST':
            playlist_id = request.data.get('playlist_id')
            playlist_name = request.data.get('playlist_name')
            
            if playlist_id == "" and playlist_name == "":
                # remove playlist settings
                SpotifyPlaylistSettings.objects.filter(user=request.user).delete()
                return Response({'detail': 'Playlist settings removed'})
            
            if not playlist_id or not playlist_name:
                return Response(
                    {'detail': 'playlist_id and playlist_name are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # update or create settings
            settings, _ = SpotifyPlaylistSettings.objects.update_or_create(
                user=request.user,
                defaults={
                    'playlist_id': playlist_id,
                    'playlist_name': playlist_name
                }
            )
            
            return Response({
                'playlist_id': settings.playlist_id,
                'playlist_name': settings.playlist_name
            })
        
        # GET request - return current settings
        settings = SpotifyPlaylistSettings.objects.filter(user=request.user).first()
        if not settings:
            return Response({'detail': 'No playlist selected'}, status=status.HTTP_404_NOT_FOUND)
            
        return Response({
            'playlist_id': settings.playlist_id,
            'playlist_name': settings.playlist_name
        })

    except SpotifyToken.DoesNotExist:
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to manage playlist settings: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_playlist(request):
    """Create a new playlist for the user."""
    try:
        token = SpotifyToken.objects.get(user=request.user)
        if token.is_expired:
            token.refresh()
        
        spotify = SpotifyService(token.access_token)
        name = request.data.get('name', 'My Cache Playlist')
        
        # create playlist
        playlist = spotify.create_playlist(name)
        
        # format response to match playlist list format
        formatted_playlist = {
            'id': playlist['id'],
            'name': playlist['name'],
            'images': playlist['images']
        }
        
        return Response(formatted_playlist)
        
    except SpotifyToken.DoesNotExist:
        return SPOTIFY_NOT_CONNECTED_RESPONSE
    except Exception as e:
        return Response(
            {'detail': f'Failed to create playlist: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
