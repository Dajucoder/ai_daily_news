from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    # 健康检查
    path('health/', views.health_check, name='health-check'),
    path('test-stream/', views.test_stream, name='test-stream'),
    
    # 会话相关
    path('conversations/', views.ConversationListCreateView.as_view(), name='conversation-list-create'),
    path('conversations/<int:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
    path('conversations/<int:conversation_id>/messages/', views.get_conversation_messages, name='conversation-messages'),
    
    # 消息相关
    path('send-message/', views.send_message, name='send-message'),
    path('send-message-simple/', views.send_message_simple, name='send-message-simple'),
    
    # 设置相关
    path('settings/', views.ChatSettingsView.as_view(), name='chat-settings'),
    
    # AI服务提供商管理
    path('providers/', views.AIProviderListCreateView.as_view(), name='provider-list'),
    path('providers/<int:pk>/', views.AIProviderDetailView.as_view(), name='provider-detail'),
    
    # AI模型管理
    path('models/', views.AIModelListCreateView.as_view(), name='model-list'),
    path('models/<int:pk>/', views.AIModelDetailView.as_view(), name='model-detail'),
    
    # API测试和模型检测
    path('test-connection/', views.test_api_connection, name='test-connection'),
    path('detect-models/', views.detect_models, name='detect-models'),
]
