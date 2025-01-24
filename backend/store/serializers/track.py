from rest_framework import serializers
from store.models.track import TrackMetadata, Track

class TrackMetadataSerializer(serializers.ModelSerializer):
    """serializer for track metadata from spotify"""
    class Meta:
        model = TrackMetadata
        fields = [
            'spotify_id',
            'title',
            'artist',
            'album',
            'preview_url',
            'image_url',
            'release_date',
        ]

class TrackSerializer(serializers.ModelSerializer):
    """basic track serializer"""
    metadata = TrackMetadataSerializer(read_only=True)
    
    class Meta:
        model = Track
        fields = [
            'id',
            'metadata',
            'status',
            'locked_at',
            'available_at',
            'revealed_at',
            'created_at',
            'played_at'
        ]

class TrackCreateSerializer(serializers.ModelSerializer):
    """serializer for creating a new track"""
    spotify_id = serializers.CharField(write_only=True)
    title = serializers.CharField(write_only=True)
    artist = serializers.CharField(write_only=True)
    album = serializers.CharField(write_only=True)
    preview_url = serializers.URLField(write_only=True, required=False, allow_null=True)
    image_url = serializers.URLField(write_only=True)
    release_date = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Track
        fields = ['spotify_id', 'title', 'artist', 'album', 'preview_url', 'image_url', 'release_date']

    def create(self, validated_data):
        # extract metadata fields
        metadata_fields = {
            'spotify_id': validated_data.pop('spotify_id'),
            'title': validated_data.pop('title'),
            'artist': validated_data.pop('artist'),
            'album': validated_data.pop('album'),
            'preview_url': validated_data.pop('preview_url', None),
            'image_url': validated_data.pop('image_url'),
            'release_date': validated_data.pop('release_date', '')
        }
        
        # try to get existing metadata first
        metadata = TrackMetadata.objects.filter(spotify_id=metadata_fields['spotify_id']).first()
        
        if not metadata:
            # create metadata from provided data
            metadata = TrackMetadata.objects.create(**metadata_fields)
        
        try:
            # create track with pending status since it's being sealed
            from django.utils import timezone
            from datetime import timedelta
            from django.conf import settings
            
            now = timezone.now()
            locked_time = (
                timedelta(days=settings.TRACK_SETTINGS['DEVELOPMENT_LOCK_DAYS'])
                if settings.TRACK_SETTINGS['DEVELOPMENT_MODE']
                else timedelta(weeks=settings.TRACK_SETTINGS['PRODUCTION_LOCK_WEEKS'])
            )
            
            # debug logging
            print(f"Debug: Creating track with metadata {metadata.id}")
            print(f"Debug: Now: {now}")
            print(f"Debug: Lock time: {locked_time}")
            print(f"Debug: Available at will be: {now + locked_time}")
            
            return Track.objects.create(
                metadata=metadata,
                user=self.context['request'].user,
                status='pending',
                locked_at=now,
                available_at=now + locked_time,
                **validated_data
            )
        except Exception as e:
            raise serializers.ValidationError(f'failed to create track: {str(e)}')
