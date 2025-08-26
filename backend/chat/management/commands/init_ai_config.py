from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.conf import settings
from chat.models import AIProvider, AIModel, ChatSettings
import os

User = get_user_model()


class Command(BaseCommand):
    help = '为现有用户初始化AI配置'

    def handle(self, *args, **options):
        # 获取环境变量中的默认配置
        default_api_key = os.getenv('SILICONFLOW_API_KEY', '')
        default_base_url = os.getenv('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
        default_model_name = os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-7B-Instruct')
        
        if not default_api_key:
            self.stdout.write(
                self.style.WARNING('未设置SILICONFLOW_API_KEY，跳过AI配置初始化')
            )
            return
        
        created_count = 0
        
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
                
                # 更新或创建聊天设置
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
                
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'为用户 {user.username} 创建了默认AI配置')
                )
        
        if created_count > 0:
            self.stdout.write(
                self.style.SUCCESS(f'成功为 {created_count} 个用户初始化了AI配置')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('所有用户都已有AI配置，无需初始化')
            )
