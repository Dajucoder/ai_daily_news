from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from django.http import StreamingHttpResponse
from django.utils import timezone
import json
import time

from .models import Conversation, Message, ChatSettings, AIProvider, AIModel
from .serializers import (
    ConversationSerializer, ConversationListSerializer, MessageSerializer,
    ChatSettingsSerializer, SendMessageSerializer, CreateConversationSerializer,
    AIProviderSerializer, AIProviderListSerializer, AIModelSerializer,
    TestAPIConnectionSerializer, ModelDetectionSerializer
)
from .services import ChatService


class ConversationPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class ConversationListCreateView(generics.ListCreateAPIView):
    """会话列表和创建视图"""
    permission_classes = [IsAuthenticated]
    pagination_class = ConversationPagination
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user, is_active=True)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateConversationSerializer
        return ConversationListSerializer
    
    @extend_schema(
        summary="获取用户会话列表",
        description="获取当前用户的所有活跃会话列表"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="创建新会话",
        description="创建一个新的AI对话会话"
    )
    def post(self, request, *args, **kwargs):
        serializer = CreateConversationSerializer(data=request.data)
        if serializer.is_valid():
            title = serializer.validated_data['title']
            first_message = serializer.validated_data.get('first_message', '')
            
            chat_service = ChatService()
            conversation = chat_service.create_conversation(
                user=request.user,
                title=title,
                first_message=first_message
            )
            
            response_serializer = ConversationSerializer(conversation)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ConversationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """会话详情视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer
    
    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)
    
    @extend_schema(
        summary="获取会话详情",
        description="获取指定会话的详细信息，包括所有消息"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新会话",
        description="更新会话信息（如标题）"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @extend_schema(
        summary="删除会话",
        description="删除指定会话及其所有消息"
    )
    def delete(self, request, *args, **kwargs):
        conversation = self.get_object()
        conversation.is_active = False
        conversation.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(
    summary="发送消息",
    description="向AI发送消息并获取回复",
    request=SendMessageSerializer,
    responses={200: MessageSerializer}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message(request):
    """发送消息并获取AI回复"""
    serializer = SendMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        chat_service = ChatService()
        conversation, ai_message = chat_service.send_message(
            user=request.user,
            message_content=serializer.validated_data['message'],
            conversation_id=serializer.validated_data.get('conversation_id')
        )
        
        # 返回AI回复的消息
        message_serializer = MessageSerializer(ai_message)
        response_data = {
            'message': message_serializer.data,
            'conversation_id': conversation.id
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ChatSettingsView(generics.RetrieveUpdateAPIView):
    """聊天设置视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = ChatSettingsSerializer
    
    def get_object(self):
        chat_service = ChatService()
        return chat_service.get_or_create_chat_settings(self.request.user)
    
    @extend_schema(
        summary="获取聊天设置",
        description="获取用户的聊天设置"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新聊天设置",
        description="更新用户的聊天设置"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)


@extend_schema(
    summary="获取会话消息",
    description="获取指定会话的消息列表",
    parameters=[
        OpenApiParameter(
            name='conversation_id',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
            description='会话ID'
        ),
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='消息数量限制',
            default=50
        )
    ],
    responses={200: MessageSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_messages(request, conversation_id):
    """获取会话消息"""
    conversation = get_object_or_404(
        Conversation,
        id=conversation_id,
        user=request.user
    )
    
    limit = int(request.GET.get('limit', 50))
    messages = conversation.messages.order_by('timestamp')[:limit]
    
    serializer = MessageSerializer(messages, many=True)
    return Response(serializer.data)


# AI配置管理视图

class AIProviderListCreateView(generics.ListCreateAPIView):
    """AI服务提供商列表和创建视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIProviderListSerializer
    
    def get_queryset(self):
        return AIProvider.objects.filter(user=self.request.user)
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return AIProviderSerializer
        return AIProviderListSerializer
    
    def list(self, request, *args, **kwargs):
        """重写list方法以确保返回正确的数据格式"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="获取AI服务提供商列表",
        description="获取用户配置的所有AI服务提供商"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="创建AI服务提供商",
        description="添加新的AI服务提供商配置"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AIProviderDetailView(generics.RetrieveUpdateDestroyAPIView):
    """AI服务提供商详情视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIProviderSerializer
    
    def get_queryset(self):
        return AIProvider.objects.filter(user=self.request.user)
    
    @extend_schema(
        summary="获取AI服务提供商详情",
        description="获取指定AI服务提供商的详细信息"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新AI服务提供商",
        description="更新AI服务提供商配置"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @extend_schema(
        summary="删除AI服务提供商",
        description="删除AI服务提供商及其所有模型"
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


class AIModelListCreateView(generics.ListCreateAPIView):
    """AI模型列表和创建视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIModelSerializer
    
    def get_queryset(self):
        provider_id = self.request.query_params.get('provider_id')
        queryset = AIModel.objects.filter(provider__user=self.request.user)
        
        if provider_id:
            queryset = queryset.filter(provider_id=provider_id)
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """重写list方法以确保返回正确的数据格式"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="获取AI模型列表",
        description="获取用户配置的所有AI模型",
        parameters=[
            OpenApiParameter(
                name='provider_id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='按提供商ID过滤',
                required=False
            )
        ]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="创建AI模型",
        description="为指定的AI服务提供商添加新模型"
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class AIModelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """AI模型详情视图"""
    permission_classes = [IsAuthenticated]
    serializer_class = AIModelSerializer
    
    def get_queryset(self):
        return AIModel.objects.filter(provider__user=self.request.user)
    
    @extend_schema(
        summary="获取AI模型详情",
        description="获取指定AI模型的详细信息"
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
    
    @extend_schema(
        summary="更新AI模型",
        description="更新AI模型配置"
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)
    
    @extend_schema(
        summary="删除AI模型",
        description="删除AI模型配置"
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)


@extend_schema(
    summary="测试API连接",
    description="测试AI服务提供商的API连接是否正常",
    request=TestAPIConnectionSerializer,
    responses={200: {'description': '连接成功'}}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def test_api_connection(request):
    """测试API连接"""
    serializer = TestAPIConnectionSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        import openai
        
        api_key = serializer.validated_data['api_key']
        api_base_url = serializer.validated_data['api_base_url']
        test_model = serializer.validated_data.get('test_model', 'gpt-3.5-turbo')
        
        # 创建临时客户端测试连接
        client = openai.OpenAI(
            api_key=api_key,
            base_url=api_base_url
        )
        
        # 发送测试请求
        response = client.chat.completions.create(
            model=test_model,
            messages=[{'role': 'user', 'content': 'test'}],
            max_tokens=1,
            timeout=10
        )
        
        return Response({
            'success': True,
            'message': 'API连接测试成功',
            'model_used': test_model
        })
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'API连接测试失败: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    summary="检测可用模型",
    description="自动检测AI服务提供商的可用模型列表",
    request=ModelDetectionSerializer,
    responses={200: {'description': '检测成功'}}
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def detect_models(request):
    """检测AI服务提供商的可用模型"""
    serializer = ModelDetectionSerializer(data=request.data, context={'request': request})
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        provider_id = serializer.validated_data['provider_id']
        provider = AIProvider.objects.get(id=provider_id, user=request.user)
        
        import openai
        
        # 创建客户端
        client = openai.OpenAI(
            api_key=provider.api_key,
            base_url=provider.api_base_url
        )
        
        # 获取模型列表
        models_response = client.models.list()
        detected_models = []
        
        for model in models_response.data:
            detected_models.append({
                'model_id': model.id,
                'model_name': model.id,
                'description': f'检测到的模型: {model.id}',
                'created': getattr(model, 'created', None)
            })
        
        return Response({
            'success': True,
            'models': detected_models,
            'count': len(detected_models)
        })
        
    except AIProvider.DoesNotExist:
        return Response({
            'success': False,
            'message': 'AI提供商不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'模型检测失败: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def health_check(request):
    """健康检查端点"""
    return Response({
        'status': 'healthy',
        'message': 'AI Daily News Chat Service is running',
        'timestamp': timezone.now()
    })


@api_view(['GET'])
def test_stream(request):
    """测试流式输出端点"""
    def test_event_stream():
        for i in range(10):
            yield f"data: {json.dumps({'type': 'test', 'count': i, 'message': f'测试消息 {i}'})}\n\n"
            time.sleep(0.5)
        yield f"data: {json.dumps({'type': 'complete', 'message': '测试完成'})}\n\n"
    
    response = StreamingHttpResponse(test_event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    response['Access-Control-Allow-Origin'] = '*'
    return response


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_message_simple(request):
    """发送消息（非流式）"""
    try:
        # 验证数据
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'error': '数据验证失败', 'details': serializer.errors}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 处理消息
        chat_service = ChatService()
        message_content = serializer.validated_data['message']
        conversation_id = serializer.validated_data.get('conversation_id')
        
        # 调用非流式发送消息方法
        result = chat_service.send_message_simple(
            user=request.user,
            message_content=message_content,
            conversation_id=conversation_id
        )
        
        return Response(result, status=status.HTTP_200_OK)
        
    except ValueError as e:
        return Response(
            {'error': str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"发送消息失败: {str(e)}")
        return Response(
            {'error': '服务器内部错误'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
