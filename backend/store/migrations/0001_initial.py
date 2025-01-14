# Generated by Django 4.2.7 on 2025-01-14 05:25

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='TrackMetadata',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('spotify_id', models.CharField(db_index=True, max_length=255)),
                ('title', models.CharField(max_length=255)),
                ('artist', models.CharField(max_length=255)),
                ('album', models.CharField(max_length=255)),
                ('preview_url', models.URLField(blank=True, null=True)),
                ('image_url', models.URLField()),
                ('release_date', models.CharField(blank=True, max_length=10)),
            ],
            options={
                'db_table': 'track_metadata',
                'indexes': [models.Index(fields=['spotify_id'], name='track_metad_spotify_5ece5f_idx')],
            },
        ),
        migrations.CreateModel(
            name='SpotifyToken',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('access_token', models.TextField()),
                ('refresh_token', models.TextField()),
                ('expires_at', models.DateTimeField()),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SpotifyPlaylistSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('playlist_id', models.CharField(max_length=255)),
                ('playlist_name', models.CharField(max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'spotify_playlist_settings',
            },
        ),
        migrations.CreateModel(
            name='Track',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('active', 'Active'), ('pending', 'Pending'), ('available', 'Available'), ('revealed', 'Revealed')], default='active', max_length=20)),
                ('locked_at', models.DateTimeField(null=True)),
                ('available_at', models.DateTimeField(null=True)),
                ('revealed_at', models.DateTimeField(null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('metadata', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='store.trackmetadata')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'tracks',
                'indexes': [models.Index(fields=['user', 'status'], name='tracks_user_id_b6404d_idx'), models.Index(fields=['metadata'], name='tracks_metadat_b79482_idx')],
                'unique_together': {('user', 'metadata')},
            },
        ),
    ]
