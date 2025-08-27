"""
AI模型管理器
负责从后端获取AI配置，管理模型选择，并提供统一的模型调用接口
"""
import json
import logging
import requests
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
import config

logger = logging.getLogger(__name__)


@dataclass
class ModelConfig:
    """模型配置信息"""
    model_id: str
    model_name: str
    provider_name: str
    provider_type: str
    api_key: str
    api_base_url: str
    max_tokens: int
    support_functions: bool
    support_vision: bool


class ModelManager:
    """AI模型管理器"""
    
    def __init__(self):
        self.models_cache = {}
        self.providers_cache = {}
        self.current_model: Optional[ModelConfig] = None
        self.cache_expiry = 0
        self.cache_duration = 86400  # 24小时缓存
        self.jwt_token = None
        self.token_expiry = 0
        
    def _authenticate_jwt(self) -> bool:
        """使用JWT进行后端认证"""
        try:
            import time
            current_time = time.time()
            
            # 检查token是否还有效（提前5分钟刷新）
            if self.jwt_token and current_time < self.token_expiry - 300:
                return True
            
            logger.info("进行JWT认证...")
            
            auth_data = {
                'username': config.BACKEND_USERNAME,
                'password': config.BACKEND_PASSWORD
            }
            
            response = requests.post(
                config.BACKEND_AUTH_ENDPOINT,
                json=auth_data,
                timeout=10
            )
            
            if response.status_code == 200:
                auth_response = response.json()
                self.jwt_token = auth_response.get('access')
                if self.jwt_token:
                    # JWT token有效期通常是1小时，这里设置为55分钟
                    self.token_expiry = current_time + 3300  # 55分钟
                    logger.info("JWT认证成功")
                    return True
                else:
                    logger.error("JWT认证响应中没有access token")
                    return False
            else:
                logger.error(f"JWT认证失败: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"JWT认证过程中发生错误: {str(e)}")
            return False
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """获取认证头"""
        headers = {'Content-Type': 'application/json'}
        
        if self.jwt_token:
            headers['Authorization'] = f'Bearer {self.jwt_token}'
        elif config.BACKEND_API_TOKEN:
            headers['Authorization'] = f'Token {config.BACKEND_API_TOKEN}'
        
        return headers
    
    def get_available_models(self, force_refresh: bool = False) -> List[ModelConfig]:
        """获取可用的AI模型列表"""
        try:
            # 检查缓存是否过期
            if not force_refresh and self.cache_expiry > 0:
                import time
                if time.time() < self.cache_expiry:
                    logger.info("使用缓存的模型配置")
                    return list(self.models_cache.values())
            
            logger.info("从后端获取最新的AI模型配置...")
            
            # 首先尝试JWT认证
            if not self._authenticate_jwt():
                logger.warning("JWT认证失败，尝试使用Token认证...")
                if not config.BACKEND_API_TOKEN:
                    logger.warning("没有可用的认证方式，将使用默认模型配置")
                    return self._get_default_models()
            
            # 从后端获取AI提供商配置
            providers_url = f"{config.BACKEND_BASE_URL}/api/chat/providers/"
            headers = self._get_auth_headers()
            
            response = requests.get(providers_url, headers=headers, timeout=10)
            if response.status_code != 200:
                if response.status_code == 401:
                    logger.warning("获取AI提供商需要认证，将使用默认模型配置")
                else:
                    logger.warning(f"获取AI提供商失败: {response.status_code}")
                return self._get_default_models()
            
            providers_data = response.json()
            logger.info(f"获取到 {len(providers_data)} 个AI提供商")
            
            # 获取所有模型
            all_models = []  # 初始化模型列表
            models_url = f"{config.BACKEND_BASE_URL}/api/chat/models/"
            logger.info(f"获取模型URL: {models_url}")
            models_response = requests.get(models_url, headers=headers, timeout=10)
            
            logger.info(f"模型API响应状态: {models_response.status_code}")
            if models_response.status_code == 200:
                models_data = models_response.json()
                logger.info(f"获取到 {len(models_data)} 个模型")
                
                # 创建提供商ID到提供商信息的映射
                provider_map = {provider['id']: provider for provider in providers_data}
                
                for model in models_data:
                    logger.info(f"检查模型: {model.get('model_name', 'Unknown')} (激活状态: {model.get('is_active', 'Unknown')})")
                    if not model.get('is_active'):
                        logger.info(f"模型 {model.get('model_name')} 未激活，跳过")
                        continue
                    
                    # 获取模型对应的提供商信息
                    provider_id = model.get('provider')
                    if provider_id and provider_id in provider_map:
                        provider = provider_map[provider_id]
                        logger.info(f"模型 {model.get('model_name')} 属于提供商: {provider.get('name')}")
                        
                        # 使用模型数据中的provider_name，避免访问敏感的api_key
                        model_config = ModelConfig(
                            model_id=model['model_id'],
                            model_name=model['model_name'],
                            provider_name=model.get('provider_name', provider.get('name')),
                            provider_type=provider.get('provider_type', 'unknown'),
                            api_key=config.SILICONFLOW_API_KEY or "",  # 使用配置中的API密钥
                            api_base_url=provider.get('api_base_url', config.SILICONFLOW_BASE_URL),
                            max_tokens=model.get('max_tokens', 4096),
                            support_functions=model.get('support_functions', False),
                            support_vision=model.get('support_vision', False)
                        )
                        all_models.append(model_config)
                        self.models_cache[model['model_id']] = model_config
                        logger.info(f"添加模型: {model['model_name']}")
                    else:
                        logger.warning(f"模型 {model.get('model_name')} 没有找到对应的提供商信息")
            else:
                logger.warning(f"获取模型失败: {models_response.status_code} - {models_response.text}")
            
            # 保存提供商信息到缓存
            for provider in providers_data:
                self.providers_cache[provider['id']] = provider
            
            # 更新缓存过期时间
            import time
            self.cache_expiry = time.time() + self.cache_duration
            
            logger.info(f"成功获取 {len(all_models)} 个可用模型")
            return all_models
            
        except Exception as e:
            logger.error(f"获取AI模型配置失败: {str(e)}")
            return self._get_default_models()
    
    def _get_default_models(self) -> List[ModelConfig]:
        """获取默认模型配置（当无法连接后端时使用）"""
        logger.warning("使用默认模型配置")
        default_model = ModelConfig(
            model_id=config.DEFAULT_MODEL_ID,
            model_name="Qwen3-8B",
            provider_name="SiliconFlow",
            provider_type="siliconflow",
            api_key=config.SILICONFLOW_API_KEY or "",  # 从环境变量获取
            api_base_url=config.SILICONFLOW_BASE_URL,
            max_tokens=4096,
            support_functions=False,
            support_vision=False
        )
        return [default_model]
    
    def select_model(self, model_id: str) -> Optional[ModelConfig]:
        """选择指定的模型"""
        if model_id in self.models_cache:
            self.current_model = self.models_cache[model_id]
            logger.info(f"已选择模型: {self.current_model.model_name} ({self.current_model.provider_name})")
            return self.current_model
        
        # 如果缓存中没有，尝试刷新
        models = self.get_available_models(force_refresh=True)
        for model in models:
            if model.model_id == model_id:
                self.current_model = model
                logger.info(f"已选择模型: {self.current_model.model_name} ({self.current_model.provider_name})")
                return self.current_model
        
        logger.error(f"未找到指定的模型: {model_id}")
        return None
    
    def get_current_model(self) -> Optional[ModelConfig]:
        """获取当前选择的模型"""
        if not self.current_model:
            # 优先选择 Qwen/Qwen3-8B 作为默认模型
            models = self.get_available_models()
            if models:
                # 查找 Qwen/Qwen3-8B 模型
                preferred_model = None
                for model in models:
                    if 'Qwen3-8B' in model.model_id or 'Qwen3-8B' in model.model_name:
                        preferred_model = model
                        break
                
                # 如果找到了首选模型，使用它；否则使用第一个可用模型
                if preferred_model:
                    self.current_model = preferred_model
                    logger.info(f"自动选择首选模型: {self.current_model.model_name}")
                else:
                    self.current_model = models[0]
                    logger.info(f"未找到首选模型，自动选择第一个可用模型: {self.current_model.model_name}")
        
        return self.current_model
    
    def get_model_by_name(self, model_name: str) -> Optional[ModelConfig]:
        """根据模型名称获取模型配置"""
        models = self.get_available_models()
        for model in models:
            if model.model_name == model_name or model.model_id == model_name:
                return model
        return None
    
    def list_models_summary(self) -> List[Dict[str, Any]]:
        """获取模型列表摘要信息"""
        models = self.get_available_models()
        summary = []
        for model in models:
            summary.append({
                'model_id': model.model_id,
                'model_name': model.model_name,
                'provider_name': model.provider_name,
                'provider_type': model.provider_type,
                'max_tokens': model.max_tokens,
                'support_functions': model.support_functions,
                'support_vision': model.support_vision,
                'is_current': model == self.current_model
            })
        return summary
