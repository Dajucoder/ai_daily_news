# Data migration to create default AI configuration for existing users

from django.db import migrations
from django.conf import settings
import os


def create_default_ai_config(apps, schema_editor):
    """为现有用户创建默认的AI配置"""
    User = apps.get_model('accounts', 'User')
    AIProvider = apps.get_model('chat', 'AIProvider')
    AIModel = apps.get_model('chat', 'AIModel')
    ChatSettings = apps.get_model('chat', 'ChatSettings')
    
    # 获取环境变量中的默认配置
    default_api_key = os.getenv('SILICONFLOW_API_KEY', '')
    default_base_url = os.getenv('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
    default_model_name = os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-7B-Instruct')
    
    # 只有在有API密钥的情况下才创建默认配置
    if not default_api_key:
        print("未设置SILICONFLOW_API_KEY，跳过创建默认AI配置")
        return
    
    # 为每个用户创建默认AI配置
    for user in User.objects.all():
        # 检查用户是否已有AI提供商
        if not AIProvider.objects.filter(user=user).exists():
            # 创建默认提供商
            provider = AIProvider.objects.create(
                user=user,
                name='默认SiliconFlow',
                provider_type='siliconflow',
                api_key=default_api_key,
                api_base_url=default_base_url,
                is_active=True,
                is_default=True
            )
            
            # 创建默认模型
            model = AIModel.objects.create(
                provider=provider,
                model_id=default_model_name,
                model_name=default_model_name,
                description='默认Qwen模型',
                max_tokens=4096,
                support_functions=False,
                support_vision=False,
                is_active=True
            )
            
            # 更新用户的聊天设置
            chat_settings, created = ChatSettings.objects.get_or_create(
                user=user,
                defaults={
                    'max_tokens': 2048,
                    'temperature': 0.7,
                    'system_prompt': '你是一个有用的AI助手，请用中文回答用户的问题。'
                }
            )
            
            # 设置默认的提供商和模型
            chat_settings.default_provider = provider
            chat_settings.default_model = model
            chat_settings.save()
            
            print(f"为用户 {user.username} 创建了默认AI配置")


def reverse_create_default_ai_config(apps, schema_editor):
    """回滚操作 - 删除默认创建的AI配置"""
    AIProvider = apps.get_model('chat', 'AIProvider')
    # 删除名为"默认SiliconFlow"的提供商（这会级联删除相关模型）
    AIProvider.objects.filter(name='默认SiliconFlow').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0002_add_ai_config_models'),
        ('accounts', '0001_initial'),  # 确保accounts app已初始化
    ]

    operations = [
        migrations.RunPython(
            create_default_ai_config,
            reverse_create_default_ai_config,
        ),
    ]
