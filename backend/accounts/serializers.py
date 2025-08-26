from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import User, UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    """用户配置序列化器"""
    
    class Meta:
        model = UserProfile
        fields = ['theme', 'language', 'notifications_enabled', 'email_notifications']


class UserSerializer(serializers.ModelSerializer):
    """用户序列化器"""
    profile = UserProfileSerializer(read_only=True)
    avatar = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                  'avatar', 'bio', 'phone', 'date_joined', 'profile']
        read_only_fields = ['id', 'date_joined']
    
    def get_avatar(self, obj):
        """获取头像URL"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                # 在Docker环境中，使用容器名访问
                if 'localhost' in request.get_host() or '127.0.0.1' in request.get_host():
                    return f"http://localhost:8000{obj.avatar.url}"
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None


class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("密码确认不匹配")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # 创建用户配置
        UserProfile.objects.create(user=user)
        
        return user


class UserLoginSerializer(serializers.Serializer):
    """用户登录序列化器"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError("用户名或密码错误")
            if not user.is_active:
                raise serializers.ValidationError("用户账户已被禁用")
            attrs['user'] = user
        else:
            raise serializers.ValidationError("必须提供用户名和密码")
        
        return attrs


class UserUpdateSerializer(serializers.ModelSerializer):
    """用户信息更新序列化器"""
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'bio', 'phone', 'avatar']
    
    def validate_email(self, value):
        user = self.instance
        if User.objects.exclude(pk=user.pk).filter(email=value).exists():
            raise serializers.ValidationError("此邮箱已被使用")
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码序列化器"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("旧密码错误")
        return value
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("新密码确认不匹配")
        return attrs
    
    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user