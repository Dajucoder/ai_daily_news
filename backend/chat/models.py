from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class Conversation(models.Model):
    """AI对话会话模型"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations', verbose_name='用户')
    title = models.CharField(max_length=200, verbose_name='会话标题')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    is_active = models.BooleanField(default=True, verbose_name='是否活跃')
    
    class Meta:
        verbose_name = 'AI对话会话'
        verbose_name_plural = 'AI对话会话'
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"


class Message(models.Model):
    """聊天消息模型"""
    ROLE_CHOICES = [
        ('user', '用户'),
        ('assistant', 'AI助手'),
        ('system', '系统'),
    ]
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages', verbose_name='会话')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, verbose_name='角色')
    content = models.TextField(verbose_name='消息内容')
    thinking = models.TextField(blank=True, null=True, verbose_name='思考过程')  # AI的思考过程
    model_name = models.CharField(max_length=200, blank=True, null=True, verbose_name='使用的模型名称')  # AI消息使用的模型
    model_provider = models.CharField(max_length=100, blank=True, null=True, verbose_name='模型提供商')  # AI消息的提供商
    timestamp = models.DateTimeField(auto_now_add=True, verbose_name='时间戳')
    token_count = models.IntegerField(default=0, verbose_name='Token数量')
    
    class Meta:
        verbose_name = '聊天消息'
        verbose_name_plural = '聊天消息'
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.conversation.title} - {self.role}: {self.content[:50]}..."


class AIProvider(models.Model):
    """AI服务提供商模型"""
    PROVIDER_CHOICES = [
        ('openai', 'OpenAI'),
        ('siliconflow', 'SiliconFlow'),
        ('freegpt', 'FreeGPT'),
        ('qwen', '通义千问'),
        ('gemini', 'Gemini'),
        ('claude', 'Claude'),
        ('custom', '自定义'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_providers', verbose_name='用户')
    name = models.CharField(max_length=100, verbose_name='提供商名称')
    provider_type = models.CharField(max_length=20, choices=PROVIDER_CHOICES, verbose_name='提供商类型')
    api_key = models.TextField(verbose_name='API密钥')  # 使用TextField以支持加密存储
    api_base_url = models.URLField(verbose_name='API基础地址')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_default = models.BooleanField(default=False, verbose_name='是否为默认配置')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = 'AI服务提供商'
        verbose_name_plural = 'AI服务提供商'
        ordering = ['-is_default', '-updated_at']
        unique_together = ['user', 'name']  # 每个用户的提供商名称唯一
    
    def __str__(self):
        return f"{self.user.username} - {self.name}"
    
    def save(self, *args, **kwargs):
        # 如果设置为默认，取消其他默认配置
        if self.is_default:
            AIProvider.objects.filter(user=self.user, is_default=True).update(is_default=False)
        super().save(*args, **kwargs)


class AIModel(models.Model):
    """AI模型配置"""
    provider = models.ForeignKey(AIProvider, on_delete=models.CASCADE, related_name='models', verbose_name='服务提供商')
    model_id = models.CharField(max_length=100, verbose_name='模型ID')
    model_name = models.CharField(max_length=100, verbose_name='模型显示名称')
    description = models.TextField(blank=True, null=True, verbose_name='模型描述')
    max_tokens = models.IntegerField(default=4096, verbose_name='最大Token数')
    support_functions = models.BooleanField(default=False, verbose_name='支持函数调用')
    support_vision = models.BooleanField(default=False, verbose_name='支持图像理解')
    input_price = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True, verbose_name='输入价格(每1K tokens)')
    output_price = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True, verbose_name='输出价格(每1K tokens)')
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = 'AI模型'
        verbose_name_plural = 'AI模型'
        ordering = ['model_name']
        unique_together = ['provider', 'model_id']  # 每个提供商的模型ID唯一
    
    def __str__(self):
        return f"{self.provider.name} - {self.model_name}"


class ChatSettings(models.Model):
    """聊天设置模型"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='chat_settings', verbose_name='用户')
    default_provider = models.ForeignKey(AIProvider, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='默认AI提供商')
    default_model = models.ForeignKey(AIModel, on_delete=models.SET_NULL, null=True, blank=True, verbose_name='默认AI模型')
    max_tokens = models.IntegerField(default=2048, verbose_name='最大Token数')
    temperature = models.FloatField(default=0.7, verbose_name='温度参数')
    system_prompt = models.TextField(
        default='你是一个有用的AI助手，请用中文回答用户的问题。',
        verbose_name='系统提示词'
    )
    
    class Meta:
        verbose_name = '聊天设置'
        verbose_name_plural = '聊天设置'
    
    def __str__(self):
        return f"{self.user.username}的聊天设置"
