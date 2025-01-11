from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from burrow.models.cache import Cache, Track
from burrow.serializers.cache import CacheBriefSerializer, CacheCreateSerializer

# crud for user caches
class CacheViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return CacheCreateSerializer
        return CacheBriefSerializer

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Cache.objects.none()
        
        # get limit from query params, if specified
        limit = self.request.query_params.get('limit')
        queryset = Cache.objects.filter(user=self.request.user).order_by('-cached_at')
        
        # apply limit if specified
        if limit is not None:
            queryset = queryset[:int(limit)]
            
        return queryset

    @action(detail=False, methods=['get'])
    def check(self, request):
        # get spotify ids from query params
        ids = request.query_params.get('ids', '').split(',')
        if not ids or not ids[0]:
            return Response({'cached_ids': []})
        
        # find which tracks are cached by this user
        cached_ids = Cache.objects.filter(
            user=request.user,
            track__spotify_id__in=ids
        ).values_list('track__spotify_id', flat=True)
        
        return Response({'cached_ids': list(cached_ids)})

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # return brief serializer data for consistency
        brief_serializer = CacheBriefSerializer(serializer.instance)
        return Response(brief_serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
