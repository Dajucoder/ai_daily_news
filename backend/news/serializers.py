from rest_framework import serializers
from .models import NewsItem, FetchHistory, SystemConfig


class NewsItemSerializer(serializers.ModelSerializer):
    """新闻条目序列化器"""
    
    class Meta:
        model = NewsItem
        fields = [
            'id', 'title', 'source', 'content', 'summary', 'url',
            'category', 'importance', 'key_points', 'timestamp',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class NewsItemListSerializer(serializers.ModelSerializer):
    """新闻条目列表序列化器（简化版）"""
    
    class Meta:
        model = NewsItem
        fields = [
            'id', 'title', 'source', 'summary', 'category',
            'importance', 'timestamp', 'created_at'
        ]


class FetchHistorySerializer(serializers.ModelSerializer):
    """获取历史序列化器"""
    
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = FetchHistory
        fields = [
            'id', 'fetch_date', 'news_count', 'status', 'status_display',
            'log_message', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class SystemConfigSerializer(serializers.ModelSerializer):
    """系统配置序列化器"""
    
    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NewsStatsSerializer(serializers.Serializer):
    """新闻统计序列化器"""
    
    total_news = serializers.IntegerField()
    today_news = serializers.IntegerField()
    week_news = serializers.IntegerField()
    month_news = serializers.IntegerField()
    last_fetch_time = serializers.DateTimeField(allow_null=True)
    category_stats = serializers.DictField()
    importance_stats = serializers.DictField()


class FetchNewsRequestSerializer(serializers.Serializer):
    """获取新闻请求序列化器"""
    
    force_refresh = serializers.BooleanField(default=False, help_text="是否强制刷新")
    max_news_count = serializers.IntegerField(default=5, min_value=1, max_value=20, help_text="最大新闻数量")


class FetchStatusSerializer(serializers.Serializer):
    """获取状态序列化器"""
    
    is_fetching = serializers.BooleanField()
    progress = serializers.IntegerField(min_value=0, max_value=100)
    message = serializers.CharField()
    start_time = serializers.DateTimeField(allow_null=True)
    estimated_completion = serializers.DateTimeField(allow_null=True)