from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # 认证相关
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.logout, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 用户信息
    path('profile/', views.user_profile, name='user_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/upload-avatar/', views.upload_avatar, name='upload_avatar'),
    path('change-password/', views.change_password, name='change_password'),
    
    # 用户配置
    path('settings/', views.get_user_settings, name='get_user_settings'),
    path('settings/update/', views.update_user_settings, name='update_user_settings'),
    
    # 统计信息
    path('stats/', views.user_stats, name='user_stats'),
]
