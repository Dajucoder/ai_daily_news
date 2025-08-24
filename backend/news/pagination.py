from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class DynamicPageNumberPagination(PageNumberPagination):
    """支持动态页面大小的分页器"""
    
    page_size = 10  # 默认页面大小
    page_size_query_param = 'page_size'  # 允许客户端通过此参数控制页面大小
    max_page_size = 100  # 最大页面大小限制
    
    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request)
        })
