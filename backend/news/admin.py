from django.contrib import admin
from .models import NewsItem, FetchHistory, SystemConfig


@admin.register(NewsItem)
class NewsItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'source', 'category', 'importance', 'timestamp', 'created_at']
    list_filter = ['category', 'importance', 'source', 'created_at']
    search_fields = ['title', 'summary', 'content']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'timestamp'
    
    fieldsets = (
        ('基本信息', {
            'fields': ('title', 'source', 'url')
        }),
        ('内容', {
            'fields': ('content', 'summary', 'key_points')
        }),
        ('分类', {
            'fields': ('category', 'importance')
        }),
        ('时间', {
            'fields': ('timestamp', 'created_at', 'updated_at')
        }),
    )


@admin.register(FetchHistory)
class FetchHistoryAdmin(admin.ModelAdmin):
    list_display = ['fetch_date', 'news_count', 'status', 'created_at']
    list_filter = ['status', 'fetch_date']
    readonly_fields = ['created_at']
    date_hierarchy = 'fetch_date'


@admin.register(SystemConfig)
class SystemConfigAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    search_fields = ['key', 'description']
    readonly_fields = ['created_at', 'updated_at']