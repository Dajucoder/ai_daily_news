from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiExample
from .models import User, UserProfile
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer
)


class CustomTokenObtainPairView(TokenObtainPairView):
    """自定义登录视图"""
    serializer_class = UserLoginSerializer
    
    @extend_schema(
        summary="用户登录",
        description="用户登录获取JWT令牌",
        examples=[
            OpenApiExample(
                "登录示例",
                value={"username": "testuser", "password": "testpass123"},
                request_only=True,
            )
        ]
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })


@extend_schema(
    summary="用户注册",
    description="创建新用户账户",
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """用户注册"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': '注册成功',
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="获取用户信息",
    description="获取当前登录用户的详细信息",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """获取用户信息"""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@extend_schema(
    summary="更新用户信息",
    description="更新当前登录用户的信息",
)
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    """更新用户信息"""
    serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'message': '信息更新成功',
            'user': UserSerializer(user).data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="修改密码",
    description="修改当前用户的密码",
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """修改密码"""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': '密码修改成功'})
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="获取用户配置",
    description="获取当前用户的配置信息",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_settings(request):
    """获取用户配置"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    serializer = UserProfileSerializer(profile)
    return Response(serializer.data)


@extend_schema(
    summary="更新用户配置",
    description="更新当前用户的配置信息",
)
@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_user_settings(request):
    """更新用户配置"""
    try:
        profile = request.user.profile
    except UserProfile.DoesNotExist:
        profile = UserProfile.objects.create(user=request.user)
    
    serializer = UserProfileSerializer(profile, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'message': '配置更新成功',
            'settings': serializer.data
        })
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="用户注销",
    description="用户注销，将刷新令牌加入黑名单",
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    """用户注销"""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({'message': '注销成功'})
    except Exception as e:
        return Response({'error': '注销失败'}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="上传用户头像",
    description="上传用户头像图片",
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_avatar(request):
    """上传用户头像"""
    if 'avatar' not in request.FILES:
        return Response(
            {'error': '请选择头像文件'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    avatar_file = request.FILES['avatar']
    
    # 验证文件类型
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if avatar_file.content_type not in allowed_types:
        return Response(
            {'error': '只支持 JPG、PNG、GIF 格式的图片'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # 验证文件大小 (2MB)
    if avatar_file.size > 2 * 1024 * 1024:
        return Response(
            {'error': '图片大小不能超过 2MB'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # 更新用户头像
        request.user.avatar = avatar_file
        request.user.save()
        
        return Response({
            'message': '头像上传成功',
            'avatar_url': request.build_absolute_uri(request.user.avatar.url)
        })
    except Exception as e:
        return Response(
            {'error': f'头像上传失败: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    summary="获取用户统计",
    description="获取当前用户的统计信息",
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_stats(request):
    """获取用户统计"""
    from news.models import NewsItem
    from django.utils import timezone
    
    # 用户相关的统计数据
    total_news = NewsItem.objects.count()
    
    # 计算用户加入天数
    join_date = request.user.date_joined.date()
    today = timezone.now().date()
    user_joined_days = (today - join_date).days
    
    stats = {
        'total_news': total_news,
        'user_joined_days': user_joined_days,
        'username': request.user.username,
        'email': request.user.email,
        'join_date': request.user.date_joined,
    }
    
    return Response(stats)
