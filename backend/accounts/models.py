from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """扩展用户模型"""
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='头像')
    bio = models.TextField(max_length=500, blank=True, verbose_name='个人简介')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        db_table = 'auth_user_extended'
    
    def __str__(self):
        return self.username


class UserProfile(models.Model):
    """用户配置模型"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='用户')
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', '浅色'),
        ('dark', '深色'),
    ], verbose_name='主题')
    language = models.CharField(max_length=10, default='zh-cn', choices=[
        ('zh-cn', '中文'),
        ('en', 'English'),
    ], verbose_name='语言')
    notifications_enabled = models.BooleanField(default=True, verbose_name='启用通知')
    email_notifications = models.BooleanField(default=True, verbose_name='邮件通知')
    
    class Meta:
        verbose_name = '用户配置'
        verbose_name_plural = '用户配置'
    
    def __str__(self):
        return f"{self.user.username}的配置"