from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import NewsItem, FetchHistory, SystemConfig
from .serializers import (
    NewsItemSerializer, 
    FetchHistorySerializer, 
    SystemConfigSerializer,
    NewsStatsSerializer
)
from .services import NewsService
from .pagination import DynamicPageNumberPagination


class NewsItemViewSet(viewsets.ModelViewSet):
    """新闻条目视图集"""
    
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DynamicPageNumberPagination
    
    @extend_schema(
        summary="获取新闻列表",
        description="获取新闻列表，支持搜索、分类、重要程度、RSS源和时间范围筛选",
        tags=["新闻管理"],
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='搜索关键词（标题、摘要、内容）'
            ),
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='新闻分类'
            ),
            OpenApiParameter(
                name='importance',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='重要程度'
            ),
            OpenApiParameter(
                name='source',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='RSS源'
            ),
            OpenApiParameter(
                name='days',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='时间范围（天数）'
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    def get_queryset(self):
        """获取查询集，支持筛选"""
        queryset = NewsItem.objects.all()
        
        # 时间范围过滤
        days = self.request.query_params.get('days')
        if days:
            try:
                days = int(days)
                start_date = timezone.now() - timedelta(days=days)
                queryset = queryset.filter(timestamp__gte=start_date)
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
        
        # RSS源过滤
        source = self.request.query_params.get('source')
        if source:
            queryset = queryset.filter(source=source)
        
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
        # 总新闻数
        total_count = NewsItem.objects.count()
        
        # 今日新闻数
        today = timezone.now().date()
        today_count = NewsItem.objects.filter(
            timestamp__date=today
        ).count()
        
        # 本周新闻数
        week_ago = timezone.now() - timedelta(days=7)
        week_count = NewsItem.objects.filter(
            timestamp__gte=week_ago
        ).count()
        
        # 按分类统计
        category_stats = NewsItem.objects.values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # 按重要程度统计
        importance_stats = NewsItem.objects.values('importance').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # 按来源统计
        source_stats = NewsItem.objects.values('source').annotate(
            count=Count('id')
        ).order_by('-count')
        
        stats_data = {
            'total_count': total_count,
            'today_count': today_count,
            'week_count': week_count,
            'category_stats': list(category_stats),
            'importance_stats': list(importance_stats),
            'source_stats': list(source_stats)
        }
        
        return Response(stats_data)
    
    @extend_schema(
        summary="批量删除新闻",
        tags=["新闻管理"],
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'ids': {
                        'type': 'array',
                        'items': {'type': 'integer'},
                        'description': '要删除的新闻ID列表'
                    }
                },
                'required': ['ids']
            }
        },
        responses={
            200: {"description": "批量删除成功"},
            400: {"description": "请求参数错误"}
        }
    )
    @action(detail=False, methods=['post'], url_path='batch-delete')
    def batch_delete(self, request):
        """批量删除新闻"""
        ids = request.data.get('ids', [])
        
        if not ids or not isinstance(ids, list):
            return Response(
                {'error': '请提供要删除的新闻ID列表'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # 删除指定的新闻
            deleted_count, _ = NewsItem.objects.filter(id__in=ids).delete()
            
            return Response({
                'message': f'成功删除 {deleted_count} 条新闻',
                'deleted_count': deleted_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'批量删除失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        summary="删除所有新闻",
        tags=["新闻管理"],
        responses={
            200: {"description": "删除所有新闻成功"},
            500: {"description": "删除失败"}
        }
    )
    @action(detail=False, methods=['post'], url_path='delete-all')
    def delete_all(self, request):
        """删除所有新闻"""
        try:
            # 删除所有新闻
            deleted_count, _ = NewsItem.objects.all().delete()
            
            return Response({
                'message': f'成功删除所有新闻，共 {deleted_count} 条',
                'deleted_count': deleted_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'删除所有新闻失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FetchHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    """获取历史视图集"""
    
    queryset = FetchHistory.objects.all()
    serializer_class = FetchHistorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = DynamicPageNumberPagination
    
    @extend_schema(
        summary="获取抓取历史列表",
        tags=["抓取管理"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class SystemConfigViewSet(viewsets.ModelViewSet):
    """系统配置视图集"""
    
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'key'
    
    @extend_schema(
        summary="获取系统配置列表",
        tags=["系统管理"]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)


class NewsServiceViewSet(viewsets.ViewSet):
    """新闻服务视图集"""
    
    permission_classes = [IsAuthenticated]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.news_service = NewsService()
    
    @extend_schema(
        summary="开始获取新闻",
        tags=["新闻服务"],
        request=None,
        responses={
            200: {"description": "获取任务已启动"},
            409: {"description": "正在获取中，请稍后再试"}
        }
    )
    @action(detail=False, methods=['post'])
    def start_fetch(self, request):
        """开始获取新闻"""
        try:
            # 移除每日限制，允许随时刷新
            # 注释掉原来的每日限制逻辑
            # today = timezone.now().date()
            # existing_history = FetchHistory.objects.filter(
            #     fetch_date=today,
            #     status='success'
            # ).first()
            # 
            # if existing_history:
            #     return Response({
            #         'message': f'今日已成功获取过新闻（{existing_history.news_count}条），如需重新获取请明日再试',
            #         'existing_count': existing_history.news_count,
            #         'fetch_time': existing_history.created_at
            #     }, status=status.HTTP_200_OK)
            
            # 获取请求参数
            max_news_count = request.data.get('max_news_count', 5)
            
            # 启动获取任务
            self.news_service.start_fetch_task(max_news_count)
            
            return Response({
                'message': '新闻获取任务已启动，请稍后查询状态',
                'max_news_count': max_news_count
            })
            
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_409_CONFLICT)
    
    @extend_schema(
        summary="获取抓取状态",
        tags=["新闻服务"],
        responses={200: {"description": "抓取状态信息"}}
    )
    @action(detail=False, methods=['get'])
    def fetch_status(self, request):
        """获取抓取状态"""
        status_info = self.news_service.get_fetch_status()
        return Response(status_info)
    
    @extend_schema(
        summary="获取AI代理状态",
        tags=["新闻服务"],
        responses={200: {"description": "AI代理状态信息"}}
    )
    @action(detail=False, methods=['get'])
    @action(detail=False, methods=['get'])
    def agent_status(self, request):
        """获取AI代理状态"""
        agent_status = self.news_service.get_agent_status()
        return Response(agent_status)
    
    @extend_schema(
        summary="获取每日总结报告列表",
        tags=["新闻服务"],
        responses={200: {"description": "每日总结报告列表"}}
    )
    @action(detail=False, methods=['get'], url_path='reports')
    def daily_reports(self, request):
        """获取每日总结报告列表"""
        reports = self.news_service.get_daily_reports()
        return Response(reports)
    
    @extend_schema(
        summary="获取最新每日总结",
        tags=["新闻服务"],
        responses={200: {"description": "最新每日总结"}}
    )
    @action(detail=False, methods=['get'], url_path='reports/latest')
    def latest_daily_report(self, request):
        """获取最新每日总结"""
        report = self.news_service.get_latest_daily_report()
        return Response(report)
    
    @extend_schema(
        summary="根据日期获取每日总结",
        tags=["新闻服务"],
        responses={200: {"description": "指定日期的每日总结"}}
    )
    @action(detail=False, methods=['get'], url_path='reports/(?P<date>[0-9-]+)')
    def daily_report_by_date(self, request, date=None):
        """根据日期获取每日总结"""
        if not date:
            return Response({"error": "日期参数缺失"}, status=400)
        report = self.news_service.get_daily_report_by_date(date)
        return Response(report)
    
    @extend_schema(
        summary="删除每日总结",
        tags=["新闻服务"],
        responses={
            200: {"description": "删除成功"},
            404: {"description": "总结不存在"}
        }
    )
    @action(detail=False, methods=['delete'], url_path='reports/(?P<date>[0-9-]+)')
    def delete_daily_report(self, request, date=None):
        """删除指定日期的每日总结"""
        if not date:
            return Response({"error": "日期参数缺失"}, status=400)
        
        try:
            result = self.news_service.delete_daily_report(date)
            if result.get('success'):
                return Response({'message': f'成功删除 {date} 的每日总结'})
            else:
                return Response(
                    {'error': result.get('error', '删除失败')}, 
                    status=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            return Response(
                {'error': f'删除每日总结失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
