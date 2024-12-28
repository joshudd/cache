from django.shortcuts import render

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Cache
from .serializers import CacheBriefSerializer

class CacheViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = CacheBriefSerializer

    def get_queryset(self):
        """Return public caches for anonymous users, or user's caches for authenticated users."""
        if self.request.user.is_authenticated:
            return Cache.objects.filter(user=self.request.user)
        # For anonymous users, return an empty queryset
        return Cache.objects.none()
