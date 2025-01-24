from django.urls import path, include
from rest_framework.routers import DefaultRouter
from store.views import spotify, auth
from store.views.track import TrackViewSet

# configure router with trailing slash support
router = DefaultRouter(trailing_slash=True)
router.register(r'tracks', TrackViewSet, basename='track')

urlpatterns = [
    path('', include(router.urls)),
    
    # auth routes
    path('auth/login/', auth.login_view, name='login'),
    path('auth/logout/', auth.logout_view, name='logout'),
    path('auth/csrf/', auth.get_csrf_token, name='csrf'),
    path('auth/signup/', auth.signup_view, name='signup'),
    path('auth/user/', auth.get_current_user, name='user'),
    
    # spotify routes
    path('spotify/auth/', spotify.get_auth_url, name='spotify_auth'),
    path('spotify/callback/', spotify.callback, name='spotify_callback'),
    path('spotify/status/', spotify.connection_status, name='spotify_status'),
    path('spotify/disconnect/', spotify.spotify_disconnect, name='spotify_disconnect'),
    path('spotify/playlists/', spotify.spotify_playlists, name='spotify_playlists'),
    path('spotify/playlist-settings/', spotify.playlist_settings, name='spotify_playlist_settings'),
    path('spotify/playlists/create/', spotify.create_playlist, name='spotify_create_playlist'),
    path('spotify/playlists/<str:playlist_id>/tracks/', spotify.add_tracks_to_playlist, name='spotify_add_tracks'),
    path('spotify/search/', spotify.spotify_search, name='spotify_search'),
    path('spotify/recently-played/', spotify.recently_played, name='spotify_recently_played'),
]
