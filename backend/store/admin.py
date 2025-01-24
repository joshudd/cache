from django.contrib import admin
from store.models.track import TrackMetadata, Track

@admin.register(TrackMetadata)
class TrackMetadataAdmin(admin.ModelAdmin):
    list_display = ('spotify_id', 'title', 'artist', 'album')
    search_fields = ('spotify_id', 'title', 'artist', 'album')
    list_filter = ('artist', 'album')
    ordering = ('title',)

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_title', 'status', 'locked_at', 'available_at', 'revealed_at')
    list_filter = ('status', 'user')
    search_fields = ('metadata__title', 'metadata__artist', 'user__username')
    raw_id_fields = ('user', 'metadata')
    ordering = ('-created_at',)

    def get_title(self, obj):
        return f"{obj.metadata.title} - {obj.metadata.artist}"
    get_title.short_description = 'Track' 