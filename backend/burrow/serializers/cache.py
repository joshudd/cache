from rest_framework import serializers
from django.utils import timezone
from burrow.models.cache import Cache, Track

class TrackSerializer(serializers.ModelSerializer):
    """Serializer for Track objects with all fields."""
    class Meta:
        model = Track
        fields = [
            'id',
            'spotify_id',
            'title',
            'artist',
            'album',
            'preview_url',
            'image_url',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class CacheBriefSerializer(serializers.ModelSerializer):
    """Simplified Cache serializer for list views."""
    title = serializers.CharField(source='track.title', read_only=True)
    artist = serializers.CharField(source='track.artist', read_only=True)
    album = serializers.CharField(source='track.album', read_only=True)
    image_url = serializers.URLField(source='track.image_url', read_only=True)
    
    class Meta:
        model = Cache
        fields = [
            'id',
            'title',
            'artist',
            'album',
            'image_url',
            'status',
            'cached_at',
            'last_listened'
        ]

class CacheDetailSerializer(serializers.ModelSerializer):
    """Detailed Cache serializer with nested song data."""
    track = TrackSerializer()
    burial_age = serializers.SerializerMethodField()
    
    class Meta:
        model = Cache
        fields = [
            'id',
            'song',
            'status',
            'cached_at',
            'last_listened',
            'listen_count',
            'notes',
            'burial_age'
        ]
        read_only_fields = ['cached_at', 'burial_age']

    def get_burial_age(self, obj):
        """Calculate how long the song has been buried."""
        return (timezone.now() - obj.last_listened).days

    def create(self, validated_data):
        """Handle nested track creation/update when caching a track."""
        track_data = validated_data.pop('track')
        
        # Get or create the track using spotify_id
        track, _ = Track.objects.get_or_create(
            spotify_id=track_data['spotify_id'],
            defaults=track_data
        )
        
        # Create the cache entry
        cache = Cache.objects.create(
            track=track,
            user=self.context['request'].user,
            **validated_data
        )
        return cache

    def update(self, instance, validated_data):
        """Handle nested track updates."""
        track_data = validated_data.pop('track', None)
        if track_data:
            # Update track if data provided
            track = instance.track
            for attr, value in track_data.items():
                setattr(track, attr, value)
            track.save()
        
        # Update cache instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class CacheCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new cache entries."""
    spotify_id = serializers.CharField(write_only=True)
    title = serializers.CharField(write_only=True)
    artist = serializers.CharField(write_only=True)
    album = serializers.CharField(required=False, allow_blank=True, write_only=True)
    preview_url = serializers.URLField(required=False, allow_null=True, write_only=True)
    image_url = serializers.URLField(required=False, allow_null=True, write_only=True)
    
    class Meta:
        model = Cache
        fields = [
            'spotify_id',
            'title',
            'artist',
            'album',
            'preview_url',
            'image_url',
            'notes',
            'status'
        ]

    def create(self, validated_data):
        """Create a new cache entry with track data."""
        # Extract track-related fields
        track_fields = ['spotify_id', 'title', 'artist', 'album', 'preview_url', 'image_url']
        track_data = {
            field: validated_data.pop(field)
            for field in track_fields
            if field in validated_data
        }

        # Get or create track
        track, _ = Track.objects.get_or_create(
            spotify_id=track_data['spotify_id'],
            defaults=track_data
        )

        # Create cache entry without setting user (it's set in the viewset)
        cache = Cache.objects.create(
            track=track,
            **validated_data
        )
        return cache