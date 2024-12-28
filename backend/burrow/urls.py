from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import auth

router = DefaultRouter()
router.register(r'caches', views.CacheViewSet, basename='cache')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', auth.login_view, name='login'),
    path('auth/logout/', auth.logout_view, name='logout'),
    path('auth/csrf/', auth.get_csrf_token, name='csrf'),
]
