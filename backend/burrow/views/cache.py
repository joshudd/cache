from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from burrow.models.cache import Cache
from burrow.serializers.cache import CacheBriefSerializer

# crud for user caches
class CacheViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CacheBriefSerializer

    def get_queryset(self):
        # return user caches or none
        if self.request.user.is_authenticated:
            return Cache.objects.filter(user=self.request.user)
        return Cache.objects.none()
