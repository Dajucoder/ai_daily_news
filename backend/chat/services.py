import openai
import json
import logging
from typing import Dict, List, Optional, Tuple
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Conversation, Message, ChatSettings, AIProvider, AIModel

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatService:
    """AI聊天服务"""
    
    def __init__(self):
        self.api_key = settings.SILICONFLOW_API_KEY
        self.base_url = settings.SILICONFLOW_BASE_URL
        self.model_name = settings.MODEL_NAME
        
        if not self.api_key:
            raise ValueError("SILICONFLOW_API_KEY not configured")
    
    def get_or_create_chat_settings(self, user: User) -> ChatSettings:
        """获取或创建用户聊天设置"""
        settings_obj, created = ChatSettings.objects.get_or_create(
            user=user,
            defaults={
                'max_tokens': 2048,
                'temperature': 0.7,
                'system_prompt': '你是一个有用的AI助手，请用中文回答用户的问题。'
            }
        )
        
        # 如果是新创建的设置且用户没有默认配置，尝试创建默认AI提供商
        if created and not settings_obj.default_provider:
            self._create_default_provider(user)
            # 重新获取设置，可能已经有默认配置了
            settings_obj.refresh_from_db()
            
        return settings_obj
    
    def _create_default_provider(self, user: User):
        """为用户创建默认的AI提供商配置"""
        # 只有在有有效API密钥且用户没有任何提供商时才创建
        if (self.api_key and 
            self.api_key != 'your-siliconflow-api-key-here' and
            self.api_key.strip() and
            not AIProvider.objects.filter(user=user).exists()):
            
            try:
                # 创建默认的SiliconFlow提供商
                default_provider = AIProvider.objects.create(
                    user=user,
                    name='默认SiliconFlow',
                    provider_type='siliconflow',
                    api_key=self.api_key,
                    api_base_url=self.base_url,
                    is_default=True
                )
                
                # 创建默认模型
                default_model = AIModel.objects.create(
                    provider=default_provider,
                    model_id=self.model_name,
                    model_name=self.model_name,
                    description='默认Qwen模型',
                    max_tokens=4096
                )
                
                # 更新聊天设置
                ChatSettings.objects.filter(user=user).update(
                    default_provider=default_provider,
                    default_model=default_model
                )
                
                logger.info(f"为用户 {user.username} 创建了默认AI配置")
                
            except Exception as e:
                logger.warning(f"创建默认AI配置失败: {str(e)}")
        else:
            logger.info(f"跳过为用户 {user.username} 创建默认AI配置 (无有效API密钥)")
    
    def create_conversation(self, user: User, title: str, first_message: str = None) -> Conversation:
        """创建新会话"""
        conversation = Conversation.objects.create(
            user=user,
            title=title
        )
        
        # 如果提供了第一条消息，则添加到会话中
        if first_message:
            Message.objects.create(
                conversation=conversation,
                role='user',
                content=first_message
            )
        
        return conversation
    
    def get_conversation_messages(self, conversation: Conversation, limit: int = 50) -> List[Dict]:
        """获取会话消息历史"""
        messages = conversation.messages.order_by('timestamp')[:limit]
        return [
            {
                'role': msg.role,
                'content': msg.content
            }
            for msg in messages
        ]
    
    def send_message(self, user: User, message_content: str, conversation_id: int = None) -> Tuple[Conversation, Message]:
        """发送消息并获取AI回复"""
        try:
            # 获取或创建会话
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(id=conversation_id, user=user)
                except Conversation.DoesNotExist:
                    raise ValueError("会话不存在或无权限访问")
            else:
                # 创建新会话，使用消息的前20个字符作为标题
                title = message_content[:20] + "..." if len(message_content) > 20 else message_content
                conversation = self.create_conversation(user, title)
            
            # 保存用户消息
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=message_content
            )
            
            # 获取用户聊天设置
            chat_settings = self.get_or_create_chat_settings(user)
            
            # 尝试获取AI回复
            try:
                # 准备消息历史
                message_history = self.get_conversation_messages(conversation)
                
                # 添加系统提示词（如果是新会话的第一条消息）
                if len(message_history) == 1:
                    message_history.insert(0, {
                        'role': 'system',
                        'content': chat_settings.system_prompt
                    })
                
                # 获取AI配置
                provider, model = self._get_ai_config(chat_settings)
                
                # 调用AI API
                ai_response = self._call_ai_api(
                    api_base_url=ai_config['api_base_url'],
                    api_key=ai_config['api_key'],
                    model_id=ai_config['model'],
                    messages=message_history,
                    max_tokens=ai_config['max_tokens'],
                    temperature=ai_config['temperature']
                )
                
                # 保存AI回复
                ai_message = Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=ai_response['content'],
                    token_count=ai_response.get('token_count', 0)
                )
                
            except Exception as e:
                # AI服务不可用时，返回友好的提示消息
                logger.warning(f"AI服务不可用，返回默认消息: {str(e)}")
                
                fallback_content = self._get_fallback_response(str(e))
                
                ai_message = Message.objects.create(
                    conversation=conversation,
                    role='assistant',
                    content=fallback_content,
                    token_count=0
                )
            
            # 更新会话时间
            conversation.save()
            
            return conversation, ai_message
            
        except Exception as e:
            logger.error(f"发送消息失败: {str(e)}")
            raise
    
    def _get_ai_config(self, user_or_settings) -> Dict:
        """获取AI配置"""
        # 兼容两种调用方式：传入User对象或ChatSettings对象
        if isinstance(user_or_settings, User):
            user = user_or_settings
            chat_settings = self.get_or_create_chat_settings(user)
        else:
            chat_settings = user_or_settings
            user = chat_settings.user
        
        provider = chat_settings.default_provider
        model = chat_settings.default_model
        
        # 如果没有配置，使用默认的或第一个可用的
        if not provider:
            provider = AIProvider.objects.filter(
                user=user, 
                is_active=True
            ).first()
            
        if not model and provider:
            model = AIModel.objects.filter(
                provider=provider,
                is_active=True
            ).first()
            
        # 如果还是没有配置，抛出异常
        if not provider or not model:
            raise ValueError("请先在AI配置页面配置服务提供商和模型")
        
        # 验证API地址
        if not provider.api_base_url or not provider.api_base_url.strip():
            raise ValueError("AI服务提供商的API地址未配置或为空")
        
        # 判断是否为本地服务（如 Ollama）
        is_local_service = (
            'localhost' in provider.api_base_url.lower() or 
            '127.0.0.1' in provider.api_base_url or 
            'ollama' in provider.api_base_url.lower() or
            'host.docker.internal' in provider.api_base_url.lower()
        )
        
        # 验证API密钥（本地服务可以为空）
        if not is_local_service and (not provider.api_key or not provider.api_key.strip()):
            raise ValueError("AI服务提供商的API密钥未配置或为空")
        
        return {
            'api_base_url': provider.api_base_url,
            'api_key': provider.api_key if not is_local_service else 'dummy-key-for-local-service',
            'model': model.model_id,
            'max_tokens': min(chat_settings.max_tokens, model.max_tokens),
            'temperature': chat_settings.temperature,
            'provider_name': provider.name,
            'model_name': model.model_name
        }
    
    def _get_fallback_response(self, error_msg: str) -> str:
        """获取AI服务不可用时的回退响应"""
        if "API密钥" in error_msg or "认证失败" in error_msg:
            return """🤖 **AI服务暂时不可用**

**原因**: API密钥未配置或无效

**解决方案**:
1. 前往 **AI配置** 页面
2. 配置有效的AI服务提供商和API密钥
3. 推荐使用 [SiliconFlow](https://siliconflow.cn) (免费额度)

**当前状态**: 聊天功能暂时使用离线模式，其他功能正常使用。"""

        elif "配置" in error_msg:
            return """🤖 **AI服务需要配置**

请前往 **AI配置** 页面设置:
- AI服务提供商 (如: SiliconFlow, OpenAI)  
- API密钥和地址
- 选择AI模型

配置完成后即可正常使用智能聊天功能。"""

        elif "网络" in error_msg or "连接" in error_msg or "超时" in error_msg or "响应时间" in error_msg:
            return """🤖 **网络连接问题**

AI服务暂时无法连接，可能原因:
- 网络连接不稳定
- AI服务提供商暂时不可用
- 防火墙或代理设置问题
- AI模型响应时间过长

**建议**: 请稍后重试，或检查网络连接。系统已移除超时限制，会等待AI完成响应。"""

        else:
            return f"""🤖 **AI服务暂时不可用**

**状态**: 系统遇到临时问题
**错误**: {error_msg[:100]}

**建议**: 请稍后重试，或前往AI配置页面检查设置。"""
    
    def _call_ai_api(self, api_base_url: str, api_key: str, model_id: str, messages: List[Dict], max_tokens: int, temperature: float) -> Dict:
        """调用AI API"""
        try:
            # 使用用户配置的AI提供商，无超时限制
            client = openai.OpenAI(
                api_key=api_key,
                base_url=api_base_url
            )
            
            # 调用API
            response = client.chat.completions.create(
                model=model_id,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
                stream=False
            )
            
            # 检查响应是否有效
            if not response.choices or not response.choices[0].message:
                raise Exception("AI API返回了空响应")
            
            # 提取回复内容
            ai_content = response.choices[0].message.content
            if not ai_content:
                ai_content = "抱歉，我无法生成有效的回复，请重试。"
            
            token_count = response.usage.total_tokens if response.usage else 0
            
            return {
                'content': ai_content,
                'token_count': token_count
            }
            
        except openai.APIConnectionError as e:
            logger.error(f"AI API连接失败: {str(e)}")
            raise Exception("无法连接到AI服务，请检查网络连接或稍后重试")
        except openai.APITimeoutError as e:
            logger.error(f"AI API请求超时: {str(e)}")
            raise Exception("AI服务响应时间过长，可能网络不稳定")
        except openai.AuthenticationError as e:
            logger.error(f"AI API认证失败: {str(e)}")
            raise Exception("AI服务认证失败，请检查API密钥配置")
        except openai.RateLimitError as e:
            logger.error(f"AI API请求频率限制: {str(e)}")
            raise Exception("请求过于频繁，请稍后重试")
        except Exception as e:
            logger.error(f"AI API调用失败: {str(e)}")
            # 提供一个友好的回退响应
            return {
                'content': f"抱歉，AI服务暂时不可用。您的问题是：{messages[-1].get('content', '')}。请稍后重试或联系管理员。",
                'token_count': 0
            }


    
    def send_message_simple(self, user, message_content: str, conversation_id: int = None):
        """非流式发送消息"""
        try:
            # 获取或创建会话
            if conversation_id:
                try:
                    conversation = Conversation.objects.get(id=conversation_id, user=user)
                except Conversation.DoesNotExist:
                    raise ValueError("会话不存在或无权限访问")
            else:
                # 创建新会话
                title = message_content[:20] + "..." if len(message_content) > 20 else message_content
                conversation = self.create_conversation(user, title)
            
            # 保存用户消息
            user_message = Message.objects.create(
                conversation=conversation,
                role='user',
                content=message_content
            )
            
            # 获取用户聊天设置
            chat_settings = self.get_or_create_chat_settings(user)
            
            # 准备消息历史
            message_history = self.get_conversation_messages(conversation)
            
            # 添加系统提示词（每次都添加，确保AI始终显示思考过程）
            if True:
                # 增强系统提示词，支持思考过程
                enhanced_system_prompt = f"""{chat_settings.system_prompt}

重要：在回答问题时，请使用以下格式来展示你的思考过程：

<thinking>
这里是你的思考过程，包括：
- 对问题的理解和分析
- 思考解决方案的步骤
- 考虑的因素和可能的问题
- 选择最佳答案的原因
</thinking>

然后再提供你的最终回答。思考过程会帮助用户更好地理解你的推理过程。"""
                
                message_history.insert(0, {
                    'role': 'system',
                    'content': enhanced_system_prompt
                })
            
            # 获取AI配置
            ai_config = self._get_ai_config(chat_settings)
            
            # 记录详细的请求信息
            logger.info(f"=== AI API 请求开始 ===")
            logger.info(f"用户: {user.username}")
            logger.info(f"会话ID: {conversation.id}")
            logger.info(f"模型提供商: {ai_config['provider_name']}")
            logger.info(f"使用模型: {ai_config['model_name']} ({ai_config['model']})")
            logger.info(f"API地址: {ai_config['api_base_url']}")
            logger.info(f"请求参数: max_tokens={ai_config['max_tokens']}, temperature={ai_config['temperature']}")
            logger.info(f"消息历史 ({len(message_history)} 条):")
            for i, msg in enumerate(message_history):
                role_display = {"system": "系统", "user": "用户", "assistant": "AI"}.get(msg['role'], msg['role'])
                content_preview = msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content']
                logger.info(f"  [{i+1}] {role_display}: {content_preview}")
            
            # 直接调用AI API获取完整回复
            ai_response = self._call_ai_api(
                api_base_url=ai_config['api_base_url'],
                api_key=ai_config['api_key'],
                model_id=ai_config['model'],
                messages=message_history,
                max_tokens=ai_config['max_tokens'],
                temperature=ai_config['temperature']
            )
            
            # 记录AI响应信息
            logger.info(f"=== AI API 响应 ===")
            logger.info(f"原始回复长度: {len(ai_response['content'])} 字符")
            logger.info(f"Token消耗: {ai_response['token_count']}")
            logger.info(f"原始回复内容:")
            logger.info(f"  {ai_response['content']}")
            
            # 提取思考内容和实际回答
            full_content = ai_response['content']
            thinking_content = self._extract_thinking_content(full_content)
            clean_content = self._clean_content_from_thinking(full_content)
            
            # 记录内容处理结果
            logger.info(f"=== 内容处理结果 ===")
            if thinking_content:
                logger.info(f"思考内容 ({len(thinking_content)} 字符): {thinking_content[:200]}...")
            else:
                logger.info(f"无思考内容")
            logger.info(f"最终回复 ({len(clean_content)} 字符): {clean_content[:200]}...")
            
            # 保存AI回复
            ai_message = Message.objects.create(
                conversation=conversation,
                role='assistant',
                content=clean_content,
                thinking=thinking_content if thinking_content else None,
                model_name=ai_config['model_name'],
                model_provider=ai_config['provider_name'],
                token_count=ai_response['token_count']
            )
            
            logger.info(f"=== 消息保存完成 ===")
            logger.info(f"消息ID: {ai_message.id}")
            logger.info(f"===================")
            
            # 更新会话时间
            conversation.save()
            
            return {
                'conversation_id': conversation.id,
                'message': {
                    'id': ai_message.id,
                    'role': ai_message.role,
                    'content': ai_message.content,
                    'thinking': ai_message.thinking,
                    'model_name': ai_message.model_name,
                    'model_provider': ai_message.model_provider,
                    'timestamp': ai_message.timestamp.isoformat(),
                    'token_count': ai_message.token_count
                }
            }
            
        except Exception as e:
            logger.error(f"发送消息失败: {str(e)}")
            raise
    

    
    def delete_conversation(self, user: User, conversation_id: int) -> bool:
        """删除会话"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
            conversation.delete()
            return True
        except Conversation.DoesNotExist:
            return False
    
    def update_conversation_title(self, user: User, conversation_id: int, new_title: str) -> bool:
        """更新会话标题"""
        try:
            conversation = Conversation.objects.get(id=conversation_id, user=user)
            conversation.title = new_title
            conversation.save()
            return True
        except Conversation.DoesNotExist:
            return False
    
    def _clean_content_from_thinking(self, content: str) -> str:
        """从内容中移除thinking标签和其中的内容"""
        import re
        # 移除<thinking>...</thinking>标签及其内容
        cleaned_content = re.sub(r'<thinking>.*?</thinking>', '', content, flags=re.DOTALL)
        # 清理多余的空行
        cleaned_content = re.sub(r'\n\s*\n\s*\n', '\n\n', cleaned_content)
        return cleaned_content.strip()
    
    def _extract_content_after_thinking(self, content: str) -> str:
        """提取thinking标签之后的内容"""
        import re
        # 移除thinking标签及其内容，只保留前后的内容
        cleaned_content = re.sub(r'<thinking>.*?</thinking>', '', content, flags=re.DOTALL)
        return cleaned_content.strip()
    
    def _extract_thinking_content(self, content: str) -> str:
        """提取thinking标签中的内容"""
        import re
        match = re.search(r'<thinking>(.*?)</thinking>', content, flags=re.DOTALL)
        if match:
            return match.group(1).strip()
        return ""
