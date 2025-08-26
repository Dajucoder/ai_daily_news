#!/usr/bin/env python
"""
测试AI API连接的简单脚本
运行: python test_ai_connection.py
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_news_backend.settings')
django.setup()

from chat.services import ChatService
from accounts.models import User

def test_ai_connection():
    """测试AI连接"""
    print("🔍 测试AI API连接...")
    
    # 检查环境变量
    api_key = os.getenv('SILICONFLOW_API_KEY')
    if not api_key:
        print("❌ 错误: SILICONFLOW_API_KEY 环境变量未设置")
        print("📝 请在.env文件中设置: SILICONFLOW_API_KEY=your-api-key")
        return False
    
    if api_key.strip() == 'your-siliconflow-api-key-here':
        print("❌ 错误: API密钥还是示例值，请设置真实的API密钥")
        return False
    
    print(f"✅ API密钥已配置: {api_key[:10]}...")
    
    try:
        # 创建ChatService实例
        chat_service = ChatService()
        
        # 获取或创建测试用户
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={'email': 'test@example.com'}
        )
        
        if created:
            print("👤 创建了测试用户")
        
        # 获取聊天设置
        settings = chat_service.get_or_create_chat_settings(user)
        print("⚙️  聊天设置已加载")
        
        # 尝试获取AI配置
        try:
            provider, model = chat_service._get_ai_config(settings)
            print(f"🤖 AI配置: {provider.name} - {model.model_name}")
            
            # 测试简单的AI调用
            print("🚀 正在测试AI调用...")
            
            messages = [
                {"role": "user", "content": "你好，这是一个连接测试。请简短回复。"}
            ]
            
            response = chat_service._call_ai_api(
                provider=provider,
                model=model,
                messages=messages,
                max_tokens=50,
                temperature=0.7
            )
            
            print(f"✅ AI响应成功: {response['content'][:100]}...")
            print(f"📊 Token使用: {response['token_count']}")
            return True
            
        except ValueError as e:
            print(f"❌ AI配置错误: {e}")
            return False
            
    except Exception as e:
        print(f"❌ 连接测试失败: {e}")
        return False

if __name__ == "__main__":
    success = test_ai_connection()
    sys.exit(0 if success else 1)
