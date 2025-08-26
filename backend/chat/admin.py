from django.contrib import admin
from .models import Conversation, Message, ChatSettings, AIProvider, AIModel


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'created_at', 'updated_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['title', 'user__username']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'role', 'content_preview', 'timestamp', 'token_count']
    list_filter = ['role', 'timestamp']
    search_fields = ['content', 'conversation__title']
    readonly_fields = ['timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = '内容预览'


@admin.register(ChatSettings)
class ChatSettingsAdmin(admin.ModelAdmin):
    list_display = ['user', 'default_provider', 'default_model', 'max_tokens', 'temperature']
    search_fields = ['user__username']


@admin.register(AIProvider)
class AIProviderAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'provider_type', 'is_active', 'is_default', 'created_at']
    list_filter = ['provider_type', 'is_active', 'is_default', 'created_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    
    def save_model(self, request, obj, form, change):
        # 如果设置为默认，取消该用户的其他默认配置
        if obj.is_default:
            AIProvider.objects.filter(user=obj.user, is_default=True).update(is_default=False)
        super().save_model(request, obj, form, change)


@admin.register(AIModel)
class AIModelAdmin(admin.ModelAdmin):
    list_display = ['model_name', 'model_id', 'provider', 'max_tokens', 'is_active', 'created_at']
    list_filter = ['provider__provider_type', 'is_active', 'support_functions', 'support_vision', 'created_at']
    search_fields = ['model_name', 'model_id', 'provider__name']
    readonly_fields = ['created_at']
