from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, extend_schema_view
from .models import NewsItem, FetchHistory, SystemConfig
from .serializers import (
    NewsItemSerializer, NewsItemListSerializer, FetchHistorySerializer,
    SystemConfigSerializer, NewsStatsSerializer, FetchNewsRequestSerializer,
    FetchStatusSerializer
)
from .services import NewsService
from .pagination import DynamicPageNumberPagination


@extend_schema_view(
    list=extend_schema(summary="获取新闻列表", tags=["新闻管理"]),
    retrieve=extend_schema(summary="获取新闻详情", tags=["新闻管理"]),
    create=extend_schema(summary="创建新闻", tags=["新闻管理"]),
    update=extend_schema(summary="更新新闻", tags=["新闻管理"]),
    destroy=extend_schema(summary="删除新闻", tags=["新闻管理"]),
)
class NewsItemViewSet(viewsets.ModelViewSet):
    """新闻条目视图集"""
    
    queryset = NewsItem.objects.all()
    permission_classes = [AllowAny]
    pagination_class = DynamicPageNumberPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return NewsItemListSerializer
        return NewsItemSerializer
    
    def get_queryset(self):
        queryset = NewsItem.objects.all()
        
        # 日期过滤
        days = self.request.query_params.get('days')
        if days:
            try:
                days = int(days)
                since_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(created_at__gte=since_date)
            except ValueError:
                pass
        
        # 分类过滤
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # 重要程度过滤
        importance = self.request.query_params.get('importance')
        if importance:
            queryset = queryset.filter(importance=importance)
        
        # 搜索
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(summary__icontains=search) |
                Q(content__icontains=search)
            )
        
        return queryset.order_by('-timestamp', '-created_at')
    
    @extend_schema(
        summary="获取新闻统计信息",
        tags=["新闻管理"],
        responses={200: NewsStatsSerializer}
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """获取新闻统计信息"""
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # 基础统计
        total_news = NewsItem.objects.count()
        today_news = NewsItem.objects.filter(created_at__date=today).count()
        week_news = NewsItem.objects.filter(created_at__gte=week_ago).count()
        month_news = NewsItem.objects.filter(created_at__gte=month_ago).count()
        
        # 最后获取时间
        last_news = NewsItem.objects.first()
        last_fetch_time = last_news.created_at if last_news else None
        
        # 分类统计
        category_stats = dict(
            NewsItem.objects.values('category')
            .annotate(count=Count('id'))
            .values_list('category', 'count')
        )
        
        # 重要程度统计
        importance_stats = dict(
            NewsItem.objects.values('importance')
            .annotate(count=Count('id'))
            .values_list('importance', 'count')
        )
        
        stats_data = {
            'total_news': total_news,
            'today_news': today_news,
            'week_news': week_news,
            'month_news': month_news,
            'last_fetch_time': last_fetch_time,
            'category_stats': category_stats,
            'importance_stats': importance_stats,
        }
        
        serializer = NewsStatsSerializer(stats_data)
        return Response(serializer.data)


@extend_schema_view(
    list=extend_schema(summary="获取获取历史列表", tags=["系统管理"]),
    retrieve=extend_schema(summary="获取获取历史详情", tags=["系统管理"]),
)
class FetchHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """获取历史视图集"""
    
    queryset = FetchHistory.objects.all()
    serializer_class = FetchHistorySerializer
    permission_classes = [AllowAny]
    pagination_class = DynamicPageNumberPagination
    
    def get_queryset(self):
        queryset = FetchHistory.objects.all()
        
        # 日期过滤
        days = self.request.query_params.get('days', 30)
        try:
            days = int(days)
            since_date = timezone.now().date() - timedelta(days=days)
            queryset = queryset.filter(fetch_date__gte=since_date)
        except ValueError:
            pass
        
        return queryset.order_by('-fetch_date', '-created_at')


@extend_schema_view(
    list=extend_schema(summary="获取系统配置列表", tags=["系统管理"]),
    retrieve=extend_schema(summary="获取系统配置详情", tags=["系统管理"]),
    create=extend_schema(summary="创建系统配置", tags=["系统管理"]),
    update=extend_schema(summary="更新系统配置", tags=["系统管理"]),
    destroy=extend_schema(summary="删除系统配置", tags=["系统管理"]),
)
class SystemConfigViewSet(viewsets.ModelViewSet):
    """系统配置视图集"""
    
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    permission_classes = [AllowAny]
    lookup_field = 'key'


@extend_schema_view(
    fetch_news=extend_schema(
        summary="获取AI新闻",
        tags=["新闻获取"],
        request=FetchNewsRequestSerializer,
        responses={200: {"description": "获取成功"}}
    ),
    fetch_status=extend_schema(
        summary="获取获取状态",
        tags=["新闻获取"],
        responses={200: FetchStatusSerializer}
    ),
)
class NewsServiceViewSet(viewsets.ViewSet):
    """新闻服务视图集"""
    
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def fetch_news(self, request):
        """获取AI新闻"""
        serializer = FetchNewsRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        force_refresh = serializer.validated_data.get('force_refresh', False)
        max_news_count = serializer.validated_data.get('max_news_count', 5)
        
        # 检查是否正在获取
        news_service = NewsService()
        if news_service.is_fetching():
            return Response(
                {'error': '正在获取新闻，请稍后再试'},
                status=status.HTTP_409_CONFLICT
            )
        
        # 移除每日限制，允许随时刷新
        # 注释掉原来的每日限制逻辑
        # if not force_refresh:
        #     today = timezone.now().date()
        #     if FetchHistory.objects.filter(
        #         fetch_date=today, 
        #         status='success'
        #     ).exists():
        #         return Response(
        #             {'message': '今日已获取新闻，如需重新获取请设置force_refresh=true'},
        #             status=status.HTTP_200_OK
        #         )
        
        # 启动后台获取任务
        try:
            news_service.start_fetch_task(max_news_count)
            return Response({
                'message': '开始获取AI新闻',
                'max_news_count': max_news_count
            })
        except Exception as e:
            return Response(
                {'error': f'启动获取任务失败: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def fetch_status(self, request):
        """获取获取状态"""
        news_service = NewsService()
        status_data = news_service.get_fetch_status()
        
        serializer = FetchStatusSerializer(status_data)
        return Response(serializer.data)