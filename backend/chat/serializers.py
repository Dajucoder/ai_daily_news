from rest_framework import serializers
from .models import Conversation, Message, ChatSettings, AIProvider, AIModel


class MessageSerializer(serializers.ModelSerializer):
    """消息序列化器"""
    class Meta:
        model = Message
        fields = ['id', 'role', 'content', 'thinking', 'model_name', 'model_provider', 'timestamp', 'token_count']
        read_only_fields = ['id', 'timestamp', 'token_count']


class ConversationSerializer(serializers.ModelSerializer):
    """会话序列化器"""
    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_active', 'messages', 'message_count']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationListSerializer(serializers.ModelSerializer):
    """会话列表序列化器（简化版）"""
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'title', 'created_at', 'updated_at', 'is_active', 'message_count', 'last_message']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                'content': last_msg.content[:100] + '...' if len(last_msg.content) > 100 else last_msg.content,
                'role': last_msg.role,
                'timestamp': last_msg.timestamp
            }
        return None


class AIProviderSerializer(serializers.ModelSerializer):
    """AI服务提供商序列化器"""
    models_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = ['id', 'name', 'provider_type', 'api_key', 'api_base_url', 
                 'is_active', 'is_default', 'models_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'api_key': {'write_only': True}  # API密钥只能写入，不返回给前端
        }
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class AIProviderListSerializer(serializers.ModelSerializer):
    """AI服务提供商列表序列化器（不包含API密钥）"""
    models_count = serializers.SerializerMethodField()
    
    class Meta:
        model = AIProvider
        fields = ['id', 'name', 'provider_type', 'api_base_url', 
                 'is_active', 'is_default', 'models_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_models_count(self, obj):
        return obj.models.filter(is_active=True).count()


class AIModelSerializer(serializers.ModelSerializer):
    """AI模型序列化器"""
    provider_name = serializers.CharField(source='provider.name', read_only=True)
    
    class Meta:
        model = AIModel
        fields = ['id', 'provider', 'provider_name', 'model_id', 'model_name', 
                 'description', 'max_tokens', 'support_functions', 'support_vision',
                 'input_price', 'output_price', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at', 'provider_name']
    
    def validate_provider(self, value):
        # 确保只能选择自己的提供商
        if value.user != self.context['request'].user:
            raise serializers.ValidationError("只能选择您自己的AI提供商")
        return value


class ChatSettingsSerializer(serializers.ModelSerializer):
    """聊天设置序列化器"""
    default_provider_name = serializers.CharField(source='default_provider.name', read_only=True)
    default_model_name = serializers.CharField(source='default_model.model_name', read_only=True)
    
    class Meta:
        model = ChatSettings
        fields = ['default_provider', 'default_provider_name', 'default_model', 
                 'default_model_name', 'max_tokens', 'temperature', 'system_prompt']
    
    def validate_default_provider(self, value):
        if value and value.user != self.context['request'].user:
            raise serializers.ValidationError("只能选择您自己的AI提供商")
        return value
    
    def validate_default_model(self, value):
        if value and value.provider.user != self.context['request'].user:
            raise serializers.ValidationError("只能选择您自己的AI模型")
        return value


class SendMessageSerializer(serializers.Serializer):
    """发送消息序列化器"""
    conversation_id = serializers.IntegerField(required=False, allow_null=True)
    message = serializers.CharField(max_length=4000)
    
    def validate_message(self, value):
        if not value.strip():
            raise serializers.ValidationError("消息内容不能为空")
        return value.strip()


class CreateConversationSerializer(serializers.Serializer):
    """创建会话序列化器"""
    title = serializers.CharField(max_length=200)
    first_message = serializers.CharField(max_length=4000, required=False, allow_blank=True)
    
    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError("会话标题不能为空")
        return value.strip()


class TestAPIConnectionSerializer(serializers.Serializer):
    """测试API连接序列化器"""
    api_key = serializers.CharField(max_length=500)
    api_base_url = serializers.URLField()
    test_model = serializers.CharField(max_length=100, required=False)
    
    def validate_api_key(self, value):
        if not value.strip():
            raise serializers.ValidationError("API密钥不能为空")
        return value.strip()


class ModelDetectionSerializer(serializers.Serializer):
    """模型检测序列化器"""
    provider_id = serializers.IntegerField()
    
    def validate_provider_id(self, value):
        try:
            provider = AIProvider.objects.get(id=value, user=self.context['request'].user)
            return value
        except AIProvider.DoesNotExist:
            raise serializers.ValidationError("AI提供商不存在或无权限访问")
