from django.db import models
from django.utils import timezone


class NewsItem(models.Model):
    """新闻条目模型"""
    
    IMPORTANCE_CHOICES = [
        ('high', '高'),
        ('medium', '中'),
        ('low', '低'),
    ]
    
    CATEGORY_CHOICES = [
        ('tech_breakthrough', '技术突破'),
        ('product_release', '产品发布'),
        ('industry_news', '行业动态'),
        ('policy_regulation', '政策法规'),
        ('research_progress', '研究进展'),
        ('application_case', '应用案例'),
        ('other', '其他'),
    ]
    
    title = models.CharField(max_length=500, verbose_name='标题')
    source = models.CharField(max_length=200, verbose_name='来源')
    content = models.TextField(verbose_name='内容')
    summary = models.TextField(verbose_name='摘要')
    url = models.URLField(blank=True, null=True, verbose_name='链接')
    category = models.CharField(
        max_length=50, 
        choices=CATEGORY_CHOICES, 
        default='other',
        verbose_name='分类'
    )
    importance = models.CharField(
        max_length=10, 
        choices=IMPORTANCE_CHOICES, 
        default='medium',
        verbose_name='重要程度'
    )
    key_points = models.JSONField(default=list, verbose_name='关键点')
    timestamp = models.DateTimeField(verbose_name='新闻时间')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '新闻条目'
        verbose_name_plural = '新闻条目'
        ordering = ['-timestamp', '-created_at']
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['category']),
            models.Index(fields=['importance']),
        ]
    
    def __str__(self):
        return self.title


class FetchHistory(models.Model):
    """获取历史记录模型"""
    
    STATUS_CHOICES = [
        ('success', '成功'),
        ('failed', '失败'),
        ('partial', '部分成功'),
    ]
    
    fetch_date = models.DateField(verbose_name='获取日期')
    news_count = models.PositiveIntegerField(default=0, verbose_name='新闻数量')
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES,
        verbose_name='状态'
    )
    log_message = models.TextField(blank=True, verbose_name='日志信息')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '获取历史'
        verbose_name_plural = '获取历史'
        ordering = ['-fetch_date', '-created_at']
        unique_together = ['fetch_date']
    
    def __str__(self):
        return f"{self.fetch_date} - {self.get_status_display()}"


class SystemConfig(models.Model):
    """系统配置模型"""
    
    key = models.CharField(max_length=100, unique=True, verbose_name='配置键')
    value = models.TextField(verbose_name='配置值')
    description = models.CharField(max_length=500, blank=True, verbose_name='描述')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '系统配置'
        verbose_name_plural = '系统配置'
        ordering = ['key']
    
    def __str__(self):
        return f"{self.key}: {self.value[:50]}"