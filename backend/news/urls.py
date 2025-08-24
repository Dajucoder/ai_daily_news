from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NewsItemViewSet, FetchHistoryViewSet, SystemConfigViewSet, NewsServiceViewSet

router = DefaultRouter()
router.register(r'news', NewsItemViewSet)
router.register(r'history', FetchHistoryViewSet)
router.register(r'config', SystemConfigViewSet)
router.register(r'service', NewsServiceViewSet, basename='news-service')

urlpatterns = [
    path('api/', include(router.urls)),
]