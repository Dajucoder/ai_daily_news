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
        
        api_key = serializer.validated_data.get('api_key', '')
        api_base_url = serializer.validated_data['api_base_url']
        test_model = serializer.validated_data.get('test_model', 'gpt-3.5-turbo')
        
        # 判断是否为本地服务（如 Ollama）
        is_local_service = (
            'localhost' in api_base_url.lower() or 
            '127.0.0.1' in api_base_url or 
            'ollama' in api_base_url.lower() or
            not api_key or not api_key.strip()
        )
        
        # 为本地服务使用虚拟API key，为远程服务验证API key
        if is_local_service:
            effective_api_key = "dummy-key-for-local-service"
        else:
            if not api_key or not api_key.strip():
                return Response({
                    'success': False,
                    'message': '远程API服务需要提供有效的API密钥'
                }, status=status.HTTP_400_BAD_REQUEST)
            effective_api_key = api_key
        
        # 创建临时客户端测试连接，设置超时时间
        client = openai.OpenAI(
            api_key=effective_api_key,
            base_url=api_base_url,
            timeout=30.0  # 30秒超时
        )
        
        # 发送测试请求
        try:
            response = client.chat.completions.create(
                model=test_model,
                messages=[{'role': 'user', 'content': 'Hello'}],
                max_tokens=10,
                temperature=0.1
            )
            
            service_type = "本地服务" if is_local_service else "远程API服务"
            
            return Response({
                'success': True,
                'message': f'{service_type}连接测试成功',
                'model_used': test_model,
                'service_type': service_type,
                'response_preview': response.choices[0].message.content[:50] if response.choices else 'No response'
            })
            
        except openai.APIConnectionError as e:
            return Response({
                'success': False,
                'message': f'无法连接到API服务: {str(e)}。请检查API地址是否正确，网络连接是否正常。'
            }, status=status.HTTP_400_BAD_REQUEST)
        except openai.AuthenticationError as e:
            if is_local_service:
                return Response({
                    'success': False,
                    'message': f'本地服务认证失败: {str(e)}。请确认本地服务（如Ollama）正在运行。'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'success': False,
                    'message': f'API认证失败: {str(e)}。请检查API密钥是否正确。'
                }, status=status.HTTP_400_BAD_REQUEST)
        except openai.APITimeoutError as e:
            return Response({
                'success': False,
                'message': f'API请求超时: {str(e)}。请稍后重试或检查网络连接。'
            }, status=status.HTTP_400_BAD_REQUEST)
        except openai.BadRequestError as e:
            return Response({
                'success': False,
                'message': f'请求参数错误: {str(e)}。请检查模型名称是否正确。'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'API调用失败: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"API连接测试失败: {str(e)}")
        return Response({
            'success': False,
            'message': f'API连接测试失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        
        # 验证API地址
        if not provider.api_base_url or not provider.api_base_url.strip():
            return Response({
                'success': False,
                'message': 'API地址未配置或为空，请先配置有效的API地址'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 判断是否为本地服务（如 Ollama）
        is_local_service = (
            'localhost' in provider.api_base_url.lower() or 
            '127.0.0.1' in provider.api_base_url or 
            'ollama' in provider.api_base_url.lower() or
            not provider.api_key or not provider.api_key.strip()
        )
        
        # 为本地服务使用虚拟API key，为远程服务验证API key
        if is_local_service:
            effective_api_key = "dummy-key-for-local-service"
        else:
            if not provider.api_key or not provider.api_key.strip():
                return Response({
                    'success': False,
                    'message': '远程API服务需要提供有效的API密钥'
                }, status=status.HTTP_400_BAD_REQUEST)
            effective_api_key = provider.api_key
        
        import openai
        
        # 创建客户端，设置较短的超时时间
        client = openai.OpenAI(
            api_key=effective_api_key,
            base_url=provider.api_base_url,
            timeout=30.0  # 30秒超时
        )
        
        # 获取模型列表
        try:
            import logging
            logger = logging.getLogger(__name__)
            
            logger.info(f"开始检测模型 - 提供商: {provider.name}, API地址: {provider.api_base_url}")
            
            models_response = client.models.list()
            detected_models = []
            
            for model in models_response.data:
                detected_models.append({
                    'model_id': model.id,
                    'model_name': model.id,
                    'description': f'检测到的模型: {model.id}',
                    'created': getattr(model, 'created', None)
                })
            
            logger.info(f"成功检测到 {len(detected_models)} 个模型")
            
            return Response({
                'success': True,
                'models': detected_models,
                'count': len(detected_models),
                'message': f'成功检测到 {len(detected_models)} 个模型'
            })
            
        except openai.APIConnectionError as e:
            logger.error(f"API连接错误: {str(e)}")
            # 如果是网络连接问题，提供一个模拟的模型列表
            if is_local_service:
                # 为本地服务提供常见的模型列表
                fallback_models = [
                    {'model_id': 'llama2', 'model_name': 'Llama 2', 'description': '本地Llama 2模型'},
                    {'model_id': 'llama2:7b', 'model_name': 'Llama 2 7B', 'description': '本地Llama 2 7B模型'},
                    {'model_id': 'codellama', 'model_name': 'Code Llama', 'description': '本地Code Llama模型'},
                ]
                return Response({
                    'success': True,
                    'models': fallback_models,
                    'count': len(fallback_models),
                    'message': f'无法连接到本地服务，返回常见模型列表。请确保本地服务正在运行。'
                })
            else:
                return Response({
                    'success': False,
                    'message': f'无法连接到API服务: {str(e)}。请检查网络连接或稍后重试。'
                }, status=status.HTTP_400_BAD_REQUEST)
        except openai.AuthenticationError as e:
            logger.error(f"API认证错误: {str(e)}")
            return Response({
                'success': False,
                'message': f'API认证失败: {str(e)}。请检查API密钥是否正确。'
            }, status=status.HTTP_400_BAD_REQUEST)
        except openai.APITimeoutError as e:
            logger.error(f"API超时错误: {str(e)}")
            return Response({
                'success': False,
                'message': f'API请求超时: {str(e)}。请稍后重试或检查网络连接。'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"未知错误: {str(e)}")
            return Response({
                'success': False,
                'message': f'API调用失败: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
    except AIProvider.DoesNotExist:
        return Response({
            'success': False,
            'message': 'AI提供商不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"模型检测失败: {str(e)}")
        return Response({
            'success': False,
            'message': f'模型检测失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
