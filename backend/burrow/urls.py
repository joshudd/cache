from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import ensure_csrf_cookie
from .views import auth, spotify, cache

# configure router to handle both slashed and unslashed urls
router = DefaultRouter(trailing_slash=False)
router.register(r'cache', cache.CacheViewSet, basename='cache')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth.login_view, name='login'),
    path('auth/logout/', auth.logout_view, name='logout'),
    path('auth/csrf/', ensure_csrf_cookie(auth.get_csrf_token), name='csrf'),
    path('auth/signup/', auth.signup_view, name='signup'),
    path('auth/user/', auth.get_current_user, name='user'),
    
    # spotify routes
    path('spotify/auth/', spotify.get_auth_url, name='spotify_auth'),
    path('spotify/callback/', ensure_csrf_cookie(spotify.callback), name='spotify_callback'),
    path('spotify/status/', spotify.connection_status, name='spotify_status'),
    path('spotify/playlists/', spotify.spotify_playlists, name='spotify_playlists'),
    path('spotify/recommendations/unique/', spotify.spotify_unique_recommendations, name='spotify_unique_recommendations'),
    path('spotify/disconnect/', spotify.spotify_disconnect, name='spotify_disconnect'),
    path('spotify/search/', spotify.spotify_search, name='spotify_search'),
    path('spotify/recently-played/', spotify.recently_played, name='spotify_recently_played'),
    path('spotify/buried-recommendations/', spotify.buried_recommendations, name='spotify_buried_recommendations'),
    path('spotify/playlist-settings/', spotify.playlist_settings, name='spotify_playlist_settings'),
    path('spotify/playlists/create/', spotify.create_playlist, name='spotify_create_playlist'),
]
