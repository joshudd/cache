from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

from store.models.track import TrackMetadata, Track
from store.models.spotify import SpotifyToken
from store.serializers.track import (
    TrackSerializer,
    TrackCreateSerializer
)
from store.services.spotify import SpotifyService

class TrackViewSet(viewsets.ModelViewSet):
    """viewset for managing tracks"""
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # add spotify service if user has valid token
        try:
            token = SpotifyToken.objects.get(user=self.request.user)
            if token:
                context['spotify'] = SpotifyService(token.get_valid_access_token())
        except Exception as e:
            print(f"Error getting spotify token: {str(e)}")
        return context

    def get_serializer_class(self):
        if self.action == 'create':
            return TrackCreateSerializer
        return TrackSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Track.objects.none()
        
        # get status filter from query params
        status = self.request.query_params.get('status')
        limit = self.request.query_params.get('limit', None)
        
        queryset = Track.objects.filter(user=self.request.user)
        
        if status:
            queryset = queryset.filter(status=status)
            
        queryset = queryset.order_by('-created_at')
        
        # apply limit if specified
        if limit:
            try:
                limit = int(limit)
                queryset = queryset[:limit]
            except ValueError:
                pass  # ignore invalid limit values
                
        return queryset

    @action(detail=True, methods=['post'])
    def lock(self, request, pk=None):
        """lock an active track, changing status to pending"""
        track = self.get_object()
        if track.status != 'active':
            return Response(
                {'detail': 'Track is not active'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # calculate available_at based on settings
        now = timezone.now()
        locked_time = (
            timedelta(days=settings.TRACK_SETTINGS['DEVELOPMENT_LOCK_DAYS'])
            if settings.TRACK_SETTINGS['DEVELOPMENT_MODE']
            else timedelta(weeks=settings.TRACK_SETTINGS['PRODUCTION_LOCK_WEEKS'])
        )
        
        # debug logging
        print(f"Debug: Locking track {track.id}")
        print(f"Debug: Now: {now}")
        print(f"Debug: Lock time: {locked_time}")
        print(f"Debug: Available at will be: {now + locked_time}")
        
        track.status = 'pending'
        track.locked_at = now
        track.available_at = now + locked_time
        track.save()
        
        serializer = self.get_serializer(track)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reveal(self, request, pk=None):
        """reveal a pending or available track"""
        track = self.get_object()
        if track.status not in ['pending', 'available']:
            return Response(
                {'detail': 'Track must be pending or available'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        track.status = 'revealed'
        track.revealed_at = timezone.now()
        track.save()
        
        serializer = self.get_serializer(track)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def make_available(self, request, pk=None):
        """make a pending track available early"""
        track = self.get_object()
        if track.status != 'pending':
            return Response(
                {'detail': 'Track must be pending'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        track.status = 'available'
        track.available_at = timezone.now()
        track.save()
        
        serializer = self.get_serializer(track)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def check(self, request):
        """check status of tracks by spotify ids"""
        spotify_ids = request.query_params.get('spotify_ids', '').split(',')
        if not spotify_ids or spotify_ids[0] == '':
            return Response(
                {'detail': 'No spotify_ids provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        tracks = Track.objects.filter(
            user=request.user,
            metadata__spotify_id__in=spotify_ids
        ).select_related('metadata')
        
        # return list of locked track ids
        locked_ids = [
            track.metadata.spotify_id 
            for track in tracks
        ]
        
        return Response({'locked_ids': locked_ids})