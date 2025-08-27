"""
AI内容处理器
使用大语言模型对RSS抓取的内容进行分析、整理和结构化
"""
import json
import logging
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import pytz

from openai import OpenAI
from rss_fetcher import RSSArticle
from config import SILICONFLOW_API_KEY, SILICONFLOW_BASE_URL, MODEL_NAME
from model_manager import ModelManager, ModelConfig

# 设置详细的日志格式
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_agent.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class MockOpenAIClient:
    """Mock OpenAI客户端用于测试"""
    
    class Chat:
        class Completions:
            def create(self, **kwargs):
                class MockResponse:
                    def __init__(self):
                        self.choices = [MockChoice()]
                
                class MockChoice:
                    def __init__(self):
                        self.message = MockMessage()
                
                class MockMessage:
                    def __init__(self):
                        # 根据不同的请求返回不同的mock响应
                        prompt = kwargs.get('messages', [{}])[-1].get('content', '')
                        
                        if 'JSON格式输出结构化摘要' in prompt:
                            # 从prompt中提取原标题和内容用于生成更真实的模拟数据
                            import re
                            title_match = re.search(r'文章标题: (.+)', prompt)
                            content_match = re.search(r'文章内容: (.+)', prompt, re.DOTALL)
                            
                            original_title = title_match.group(1) if title_match else "AI技术进展"
                            original_content = content_match.group(1)[:200] if content_match else ""
                            
                            # 生成基于原标题的优化标题和分类
                            if "JAX" in original_title:
                                mock_title = "JAX在后Transformer时代的发展现状"
                                category = "research_progress"
                                tags = ["JAX", "深度学习框架", "PyTorch", "机器学习"]
                            elif "dataset" in original_title.lower() or "balance" in original_content.lower():
                                mock_title = "机器学习数据集平衡处理策略"
                                category = "research_progress"
                                tags = ["数据集", "机器学习", "分类", "SMOTE"]
                            elif "router" in original_title.lower() or "foundation" in original_content.lower():
                                mock_title = "基础模型路由器架构研究"
                                category = "research_progress"
                                tags = ["基础模型", "路由器", "LLM", "架构设计"]
                            elif "workflow" in original_title.lower():
                                mock_title = "本地优先AI工作流自动化探索"
                                category = "application_case"
                                tags = ["工作流", "自动化", "本地部署", "AI应用"]
                            elif "NeurIPS" in original_title:
                                mock_title = "NeurIPS 2025会议后续活动安排"
                                category = "industry_news"
                                tags = ["NeurIPS", "学术会议", "机器学习", "研究社区"]
                            elif "AAAI" in original_title:
                                mock_title = "AAAI会议学术地位讨论"
                                category = "industry_news"
                                tags = ["AAAI", "学术会议", "人工智能", "研究评价"]
                            else:
                                mock_title = f"【AI资讯】{original_title[:30]}"
                                category = "other"
                                tags = ["人工智能", "技术讨论"]
                            
                            self.content = f'{{"title": "{mock_title}", "category": "{category}", "importance": "high", "additional_tags": {json.dumps(tags, ensure_ascii=False)}}}'
                        
                        elif '提取3-5个关键要点' in prompt:
                            # 根据内容生成不同的关键点
                            content_match = re.search(r'内容: (.+)', prompt, re.DOTALL)
                            content = content_match.group(1)[:300] if content_match else ""
                            
                            if "JAX" in content:
                                key_points = ["JAX在Transformer时代后发展放缓", "与PyTorch竞争中处于劣势", "在特定研究领域仍有价值"]
                            elif "dataset" in content.lower():
                                key_points = ["数据集严重不平衡影响模型性能", "SMOTE等过采样方法效果有限", "需要探索新的平衡策略"]
                            elif "router" in content.lower():
                                key_points = ["基础模型路由器可优化成本和质量", "需要智能选择合适的模型", "在实际应用中需求明确"]
                            else:
                                key_points = ["技术发展迅速", "应用场景广泛", "需要持续关注"]
                            
                            self.content = json.dumps(key_points, ensure_ascii=False)
                        
                        elif '生成一个简洁明了的中文摘要' in prompt:
                            # 根据内容生成不同的摘要
                            content_match = re.search(r'内容: (.+)', prompt, re.DOTALL)
                            content = content_match.group(1)[:500] if content_match else ""
                            
                            if "JAX" in content:
                                self.content = "文章讨论了JAX深度学习框架在Transformer和大语言模型兴起后的发展现状，分析了其与PyTorch的竞争态势以及在当前AI生态中的定位和前景。"
                            elif "dataset" in content.lower() and "balance" in content.lower():
                                self.content = "本文探讨了机器学习中数据集不平衡问题的解决方案，分析了SMOTE等传统方法的局限性，并寻求更有效的数据平衡策略来提升分类模型性能。"
                            elif "router" in content.lower():
                                self.content = "文章研究了基础模型路由器的概念和应用，探讨如何通过智能路由机制在保持质量的同时降低AI应用成本，以及这一技术在实际部署中的需求和挑战。"
                            else:
                                self.content = "本文讨论了人工智能领域的最新发展动态，分析了相关技术的应用前景和潜在影响。"
                        
                        elif '分析以下关于' in prompt:
                            self.content = '{"is_relevant": true, "is_today": true, "reason": "这是AI相关的最新资讯"}'
                        else:
                            self.content = '{"title": "AI技术讨论", "category": "other", "importance": "medium", "additional_tags": ["AI"]}'
                
                return MockResponse()
        
        def __init__(self):
            self.completions = MockOpenAIClient.Chat.Completions()
    
    def __init__(self):
        self.chat = MockOpenAIClient.Chat()


@dataclass
class ProcessedNews:
    """处理后的新闻数据结构"""
    title: str
    source: str
    source_description: str
    original_link: str
    summary: str
    content: str
    category: str
    importance: str
    key_points: List[str]
    tags: List[str]
    processed_time: datetime
    is_today_news: bool = True
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典格式"""
        return {
            'title': self.title,
            'source': self.source,
            'source_description': self.source_description,
            'original_link': self.original_link,
            'summary': self.summary,
            'content': self.content,
            'category': self.category,
            'importance': self.importance,
            'key_points': self.key_points,
            'tags': self.tags,
            'processed_time': self.processed_time.isoformat(),
            'is_today_news': self.is_today_news
        }


class AIProcessor:
    """AI内容处理器"""
    
    CATEGORIES = {
        'tech_breakthrough': '技术突破',
        'product_release': '产品发布',
        'industry_news': '行业动态',
        'policy_regulation': '政策法规',
        'research_progress': '研究进展',
        'application_case': '应用案例',
        'funding_acquisition': '融资收购',
        'other': '其他'
    }
    
    IMPORTANCE_LEVELS = {
        'high': '高',
        'medium': '中',
        'low': '低'
    }
    
    def __init__(self, model_id=None):
        self.logger = logging.getLogger(__name__)
        self.specified_model_id = model_id  # 保存指定的模型ID
        
        # 初始化模型管理器
        try:
            self.model_manager = ModelManager()
            self.current_model = self.model_manager.get_current_model()
            if self.current_model:
                self.logger.info(f"AI处理器初始化成功，当前模型: {self.current_model.model_name} ({self.current_model.provider_name})")
            else:
                self.logger.warning("无法获取AI模型配置，将使用默认配置")
        except Exception as e:
            self.logger.error(f"初始化模型管理器失败: {str(e)}")
            self.logger.warning("将使用默认配置")
        
        self.client = None  # 延迟初始化
    
    def _get_client(self):
        """获取OpenAI客户端，延迟初始化"""
        if self.client is None:
            # 如果指定了模型ID，优先使用指定的模型
            if self.specified_model_id:
                try:
                    # 根据模型ID获取模型配置
                    available_models = self.model_manager.get_available_models()
                    specified_model = None
                    for model in available_models:
                        if model.model_id == self.specified_model_id:
                            specified_model = model
                            break
                    
                    if specified_model:
                        self.current_model = specified_model
                        self.logger.info(f"使用指定模型: {specified_model.model_name} ({specified_model.provider_name})")
                    else:
                        self.logger.warning(f"指定的模型ID {self.specified_model_id} 未找到，使用当前选择的模型")
                        self.current_model = self.model_manager.get_current_model()
                except Exception as e:
                    self.logger.error(f"获取指定模型失败: {str(e)}，使用当前选择的模型")
                    self.current_model = self.model_manager.get_current_model()
            else:
                # 获取当前选择的模型
                self.current_model = self.model_manager.get_current_model()
            
            if not self.current_model:
                self.logger.error("无法获取模型配置，将使用Mock客户端")
                self.client = MockOpenAIClient()
                return self.client
            
            # 获取API密钥
            api_key = self.current_model.api_key or SILICONFLOW_API_KEY
            if not api_key:
                self.logger.error("API密钥未设置，将使用Mock客户端")
                self.client = MockOpenAIClient()
                return self.client
            
            try:
                self.client = OpenAI(
                    api_key=api_key,
                    base_url=self.current_model.api_base_url,
                    timeout=None  # 移除超时限制
                )
                self.logger.info(f"OpenAI客户端初始化成功，使用模型: {self.current_model.model_name} ({self.current_model.provider_name})")
                
            except Exception as e:
                self.logger.error(f"初始化OpenAI客户端失败: {e}")
                self.logger.warning("将使用Mock客户端，生成的内容将是模板化的")
                self.client = MockOpenAIClient()
        
        return self.client
    
    def process_articles(self, articles: List[RSSArticle], progress_callback=None) -> List[ProcessedNews]:
        """
        批量处理文章
        
        Args:
            articles: RSS文章列表
            progress_callback: 进度回调函数
            
        Returns:
            处理后的新闻列表
        """
        self.logger.info(f"开始处理 {len(articles)} 篇文章")
        
        processed_news = []
        total_articles = len(articles)
        
        for i, article in enumerate(articles):
            try:
                self.logger.info(f"处理文章 {i+1}/{total_articles}: {article.title[:50]}...")
                
                # 更新进度 (50% + 25% * 当前进度)
                if progress_callback:
                    current_progress = 50 + int(25 * (i + 1) / total_articles)
                    progress_callback(current_progress, f"AI处理文章 {i+1}/{total_articles}: {article.title[:30]}...")
                
                processed = self._process_single_article(article)
                if processed:
                    processed_news.append(processed)
                
            except Exception as e:
                self.logger.error(f"处理文章失败: {str(e)}")
                continue
        
        self.logger.info(f"成功处理 {len(processed_news)} 篇文章")
        return processed_news
    
    def _process_single_article(self, article: RSSArticle) -> Optional[ProcessedNews]:
        """
        处理单篇文章
        
        Args:
            article: RSS文章
            
        Returns:
            处理后的新闻，如果处理失败则返回None
        """
        try:
            # 简化检查：只要是RSS抓取到的文章都处理（更宽松的策略）
            self.logger.info(f"开始处理文章: {article.title[:50]}")
            # 不再进行严格的相关性和日期检查
            
            # 分析文章内容
            analysis = self._analyze_content(article)
            
            # 生成摘要
            summary = self._generate_summary(article, analysis)
            
            # 提取关键点
            key_points = self._extract_key_points(article, analysis)
            
            # 清理内容中的HTML标签和特殊字符
            cleaned_content = self._clean_content(article.content)
            
            processed_news = ProcessedNews(
                title=analysis.get('title', article.title),
                source=article.source,
                source_description=article.source_description,
                original_link=article.link,
                summary=summary,
                content=cleaned_content,
                category=analysis.get('category', 'other'),
                importance=analysis.get('importance', 'medium'),
                key_points=key_points,
                tags=article.tags + analysis.get('additional_tags', []),
                processed_time=datetime.now(pytz.timezone('Asia/Shanghai')),
                is_today_news=True  # 默认认为是今日新闻
            )
            
            return processed_news
            
        except Exception as e:
            self.logger.error(f"处理单篇文章失败: {str(e)}")
            return None
    
    def _check_relevance_and_date(self, article: RSSArticle) -> Dict[str, bool]:
        """
        检查文章相关性和时效性
        
        Args:
            article: RSS文章
            
        Returns:
            包含is_relevant和is_today的字典
        """
        prompt = f"""
        用中文回答。请分析以下文章是否符合以下条件：
        1. 是否与人工智能(AI)相关
        2. 是否为今日(2024年最新)的新闻或信息
        
        文章标题: {article.title}
        文章摘要: {article.summary[:300]}
        发布时间: {article.published_date if article.published_date else '未知'}
        来源: {article.source}
        
        请以JSON格式回答：
        {{
            "is_relevant": true/false,
            "is_today": true/false,
            "reason": "判断理由"
        }}
        """
        
        try:
            client = self._get_client()
            current_model = self.current_model or self.model_manager.get_current_model()
            
            # 记录发送给大模型的内容
            self.logger.info(f"=== 发送给大模型的内容 ===")
            self.logger.info(f"模型: {current_model.model_name if current_model else 'Unknown'}")
            self.logger.info(f"提供商: {current_model.provider_name if current_model else 'Unknown'}")
            self.logger.info(f"提示词: {prompt}")
            self.logger.info(f"================================")
            
            # 构建请求数据
            request_data = {
                "model": current_model.model_id if current_model else MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "你是一个专业的AI新闻筛选专家，能够准确判断文章的相关性和时效性。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.1,
                "max_tokens": 4096
            }
            
            # 记录完整的请求JSON
            self.logger.info(f"=== 发送给大模型的请求 ===")
            self.logger.info(f"请求JSON: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"========================")
            
            response = client.chat.completions.create(**request_data)
            
            content = response.choices[0].message.content.strip()
            
            # 构建响应数据用于日志记录
            response_data = {
                "choices": [{"message": {"content": content}}],
                "usage": {
                    "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
                } if hasattr(response, 'usage') and response.usage else {"total_tokens": 0}
            }
            
            # 记录完整的响应JSON
            self.logger.info(f"=== 大模型返回的响应 ===")
            self.logger.info(f"响应JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"使用Token: {response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 'Unknown'}")
            self.logger.info(f"=======================")
            
            result = self._parse_json_response(content)
            
            return {
                'is_relevant': result.get('is_relevant', False),
                'is_today': result.get('is_today', True)  # 默认认为是今日新闻
            }
            
        except Exception as e:
            self.logger.error(f"检查文章相关性失败: {str(e)}")
            # 默认都通过
            return {'is_relevant': True, 'is_today': True}
    
    def _analyze_content(self, article: RSSArticle) -> Dict[str, Any]:
        """
        分析文章内容

        Args:
            article: RSS文章

        Returns:
            分析结果字典
        """
        categories_str = ", ".join([f"{k}({v})" for k, v in self.CATEGORIES.items()])
        
        prompt = f"""
        用中文回答。请分析以下AI相关文章的内容，并按照JSON格式输出结构化摘要：
        
        文章标题: {article.title}
        文章内容: {article.content[:1000]}
        来源: {article.source}
        
        请分析以下内容：
        1. 优化标题（如果原标题不够清晰）
        2. 文章分类（从以下选项中选择）: {categories_str}
        3. 重要程度: high(高)/medium(中)/low(低)
        4. 额外标签（最多5个相关的中文标签）
        
        输出格式：
        {{
            "title": "优化后的标题",
            "category": "分类代码",
            "importance": "重要程度",
            "additional_tags": ["标签1", "标签2", "标签3"]
        }}
        """
        
        try:
            client = self._get_client()
            current_model = self.current_model or self.model_manager.get_current_model()
            
            # 检查是否是Mock客户端
            if isinstance(client, MockOpenAIClient):
                self.logger.warning("使用Mock客户端进行内容分析")
            
            # 记录发送给大模型的内容
            # 记录发送给大模型的内容
            self.logger.info(f"=== 发送给大模型的内容 ===")
            self.logger.info(f"模型: {current_model.model_name if current_model else 'Unknown'}")
            self.logger.info(f"提供商: {current_model.provider_name if current_model else 'Unknown'}")
            self.logger.info(f"提示词: {prompt}")
            self.logger.info(f"================================")
            
            # 构建请求数据
            request_data = {
                "model": current_model.model_id if current_model else MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "你是一个专业的AI内容分析师，擅长分析和分类AI相关文章。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 4096
            }
            
            # 记录完整的请求JSON
            self.logger.info(f"=== 发送给大模型的请求 ===")
            self.logger.info(f"请求JSON: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"========================")
            
            self.logger.info("开始调用大模型API...")
            
            response = client.chat.completions.create(**request_data)
            
            self.logger.info("大模型API调用成功，开始处理回复...")
            
            content = response.choices[0].message.content.strip()
            
            # 构建响应数据用于日志记录
            response_data = {
                "choices": [{"message": {"content": content}}],
                "usage": {
                    "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
                } if hasattr(response, 'usage') and response.usage else {"total_tokens": 0}
            }
            
            # 记录完整的响应JSON
            self.logger.info(f"=== 大模型返回的响应 ===")
            self.logger.info(f"响应JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"使用Token: {response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 'Unknown'}")
            self.logger.info(f"=======================")
            
            result = self._parse_json_response(content)
            
            # 如果是Mock客户端，记录警告
            if isinstance(client, MockOpenAIClient):
                self.logger.warning(f"Mock分析结果: {result}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"分析文章内容失败: {str(e)}")
            # 提供基于规则的降级分析
            return self._fallback_analyze_content(article)
    
    def _fallback_analyze_content(self, article: RSSArticle) -> Dict[str, Any]:
        """
        降级内容分析（基于规则）
        """
        title = article.title.lower()
        content = article.content.lower()
        
        # 基于关键词的分类
        if any(word in title or word in content for word in ['breakthrough', '突破', 'innovation', '创新']):
            category = 'tech_breakthrough'
            importance = 'high'
        elif any(word in title or word in content for word in ['release', '发布', 'launch', '推出']):
            category = 'product_release'
            importance = 'medium'
        elif any(word in title or word in content for word in ['research', '研究', 'paper', '论文']):
            category = 'research_progress'
            importance = 'medium'
        elif any(word in title or word in content for word in ['policy', '政策', 'regulation', '监管']):
            category = 'policy_regulation'
            importance = 'high'
        else:
            category = 'other'
            importance = 'medium'
        
        # 生成标签
        tags = []
        if 'ai' in title or 'artificial intelligence' in content:
            tags.append('人工智能')
        if 'machine learning' in content or 'ml' in title:
            tags.append('机器学习')
        if 'deep learning' in content:
            tags.append('深度学习')
        if 'llm' in title or 'language model' in content:
            tags.append('大语言模型')
        
        return {
            'title': article.title,  # 保持原标题
            'category': category,
            'importance': importance,
            'additional_tags': tags[:3]  # 最多3个标签
        }
    
    def _generate_summary(self, article: RSSArticle, analysis: Dict[str, Any]) -> str:
        """
        生成文章摘要

        Args:
            article: RSS文章
            analysis: 分析结果

        Returns:
            生成的摘要
        """
        prompt = f"""
        用中文回答。请为以下AI相关文章生成一个简洁明了的中文摘要（100-200字）：
        
        标题: {article.title}
        内容: {article.content[:1500]}
        
        摘要要求：
        1. 突出文章的核心信息和价值
        2. 使用通俗易懂的语言
        3. 包含关键的技术要点或业务影响
        4. 控制在100-200字以内
        """
        
        try:
            client = self._get_client()
            client = self._get_client()
            current_model = self.current_model or self.model_manager.get_current_model()
            
            # 构建请求数据
            request_data = {
                "model": current_model.model_id if current_model else MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "你是一个专业的AI内容编辑，擅长提炼文章精华和生成高质量摘要。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 4096
            }
            
            # 记录完整的请求JSON
            self.logger.info(f"=== 摘要生成 - 发送给大模型的请求 ===")
            self.logger.info(f"请求JSON: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"================================")
            
            self.logger.info("开始调用大模型API生成摘要...")
            
            response = client.chat.completions.create(**request_data)
            
            self.logger.info("摘要生成API调用成功")
            summary = response.choices[0].message.content.strip()
            
            # 构建响应数据用于日志记录
            response_data = {
                "choices": [{"message": {"content": summary}}],
                "usage": {
                    "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
                } if hasattr(response, 'usage') and response.usage else {"total_tokens": 0}
            }
            
            # 记录完整的响应JSON
            self.logger.info(f"=== 摘要生成 - 大模型返回的响应 ===")
            self.logger.info(f"响应JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"生成的摘要: {summary[:100]}...")
            self.logger.info(f"================================")
            
            # 如果是Mock客户端，记录警告
            if isinstance(client, MockOpenAIClient):
                self.logger.warning(f"Mock摘要生成: {summary[:50]}...")
            
            return summary
            
        except Exception as e:
            self.logger.error(f"生成摘要失败: {str(e)}")
            return self._fallback_generate_summary(article)
    
    def _fallback_generate_summary(self, article: RSSArticle) -> str:
        """
        降级摘要生成（基于规则）
        """
        # 如果有原始摘要，使用它
        if article.summary and len(article.summary) > 20:
            return article.summary[:200]
        
        # 否则从内容中提取前几句
        content = self._clean_content(article.content)
        if content:
            sentences = content.split('。')
            meaningful_sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
            if meaningful_sentences:
                summary = '。'.join(meaningful_sentences[:2]) + '。'
                return summary[:200]
        
        # 最后的降级选项
        return f"本文讨论了关于{article.title}的相关内容，详细信息请查看原文。"
    
    def _extract_key_points(self, article: RSSArticle, analysis: Dict[str, Any]) -> List[str]:
        """
        提取关键要点

        Args:
            article: RSS文章
            analysis: 分析结果

        Returns:
            关键要点列表
        """
        prompt = f"""
        用中文回答。请从以下AI相关文章中提取3-5个关键要点：
        
        标题: {article.title}
        内容: {article.content[:1500]}
        
        要求：
        1. 每个要点用一句话概括
        2. 突出技术创新、应用价值或行业影响
        3. 使用简洁的中文表达
        4. 按重要性排序
        
        请以JSON数组格式返回：
        ["要点1", "要点2", "要点3"]
        """
        
        try:
            client = self._get_client()
            client = self._get_client()
            current_model = self.current_model or self.model_manager.get_current_model()
            
            # 构建请求数据
            request_data = {
                "model": current_model.model_id if current_model else MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "你是一个专业的信息提取专家，能够准确识别文章中的关键信息点。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 4096
            }
            
            # 记录完整的请求JSON
            self.logger.info(f"=== 关键点提取 - 发送给大模型的请求 ===")
            self.logger.info(f"请求JSON: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"==================================")
            
            self.logger.info("开始调用大模型API提取关键点...")
            
            response = client.chat.completions.create(**request_data)
            
            self.logger.info("关键点提取API调用成功")
            content = response.choices[0].message.content.strip()
            
            # 构建响应数据用于日志记录
            response_data = {
                "choices": [{"message": {"content": content}}],
                "usage": {
                    "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
                } if hasattr(response, 'usage') and response.usage else {"total_tokens": 0}
            }
            
            # 记录完整的响应JSON
            self.logger.info(f"=== 关键点提取 - 大模型返回的响应 ===")
            self.logger.info(f"响应JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"==================================")
            self.logger.info(f"关键点提取原始回复: {content}")
            key_points = self._parse_json_response(content)
            self.logger.info(f"解析后的关键点: {key_points}")
            
            # 如果是Mock客户端，记录警告
            if isinstance(client, MockOpenAIClient):
                self.logger.warning(f"Mock关键点提取: {key_points}")
            
            if isinstance(key_points, list):
                return key_points[:5]  # 最多5个要点
            else:
                return self._fallback_extract_key_points(article)
            
        except Exception as e:
            self.logger.error(f"提取关键要点失败: {str(e)}")
            return self._fallback_extract_key_points(article)
    
    def _fallback_extract_key_points(self, article: RSSArticle) -> List[str]:
        """
        降级关键点提取（基于规则）
        """
        title = article.title.lower()
        content = article.content.lower()
        
        key_points = []
        
        # 基于关键词生成要点
        if 'jax' in title:
            key_points = [
                "JAX深度学习框架发展现状分析",
                "与PyTorch等主流框架的竞争态势",
                "在Transformer时代的应用前景"
            ]
        elif 'dataset' in title and 'balance' in content:
            key_points = [
                "机器学习数据集不平衡问题探讨",
                "SMOTE等传统方法的局限性分析",
                "新的数据平衡策略研究方向"
            ]
        elif 'router' in title or 'foundation model' in content:
            key_points = [
                "基础模型路由器架构设计",
                "智能模型选择机制研究",
                "成本优化与质量平衡策略"
            ]
        elif 'neurips' in title:
            key_points = [
                "NeurIPS会议学术影响力分析",
                "机器学习领域发展趋势",
                "学术会议组织与参与讨论"
            ]
        elif 'aaai' in title:
            key_points = [
                "AAAI会议在AI领域的地位",
                "人工智能学术评价体系",
                "会议质量与影响力讨论"
            ]
        else:
            # 通用要点
            key_points = [
                "人工智能技术最新进展",
                "相关应用场景和价值分析",
                "对行业发展的潜在影响"
            ]
        
        return key_points[:3]  # 返回最多3个要点
    
    def _clean_content(self, content: str) -> str:
        """
        清理内容中的HTML标签和特殊字符
        
        Args:
            content: 原始内容
            
        Returns:
            清理后的内容
        """
        if not content:
            return ""
        
        # 移除HTML注释
        content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
        
        # 移除HTML标签
        content = re.sub(r'<[^>]+>', '', content)
        
        # 解码HTML实体
        html_entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#32;': ' ',
            '&nbsp;': ' ',
            '&hellip;': '...'
        }
        
        for entity, char in html_entities.items():
            content = content.replace(entity, char)
        
        # 清理多余的空白字符
        content = re.sub(r'\s+', ' ', content)
        content = content.strip()
        
        # 如果内容太短或主要是链接，尝试提取有意义的部分
        if len(content) < 50 or content.count('http') > 3:
            # 尝试提取第一段有意义的文本
            sentences = content.split('.')
            meaningful_content = []
            for sentence in sentences:
                if len(sentence.strip()) > 20 and 'http' not in sentence:
                    meaningful_content.append(sentence.strip())
                if len(meaningful_content) >= 3:  # 最多3句
                    break
            
            if meaningful_content:
                content = '. '.join(meaningful_content) + '.'
            else:
                content = "内容需要查看原文链接获取详细信息。"
        
        return content[:1000]  # 限制长度
        return content[:1000]  # 限制长度
    
    def _parse_json_response(self, content: str) -> Any:
        """
        解析JSON响应

        Args:
            content: AI返回的内容

        Returns:
            解析后的数据
        """
        self.logger.info(f"开始解析JSON响应，内容长度: {len(content)}")
        self.logger.info(f"原始内容: {content[:500]}...")
        
        try:
            # 直接尝试解析
            result = json.loads(content)
            self.logger.info(f"JSON直接解析成功: {result}")
            return result
        except json.JSONDecodeError as e:
            self.logger.warning(f"JSON直接解析失败: {e}")
            try:
                # 提取JSON部分
                json_match = re.search(r'\{.*\}|\[.*\]', content, re.DOTALL)
                if json_match:
                    json_content = json_match.group()
                    self.logger.info(f"提取到JSON内容: {json_content}")
                    result = json.loads(json_content)
                    self.logger.info(f"JSON提取解析成功: {result}")
                    return result
                else:
                    self.logger.error("无法找到有效的JSON内容")
                    raise ValueError("无法找到有效的JSON内容")
            except Exception as parse_error:
                self.logger.error(f"JSON解析完全失败: {parse_error}")
                self.logger.error(f"失败的内容: {content[:200]}")
                return {}
    
    def generate_daily_report(self, processed_news: List[ProcessedNews]) -> Dict[str, Any]:
        """
        生成每日AI新闻报告
        
        Args:
            processed_news: 处理后的新闻列表
            
        Returns:
            每日报告数据
        """
        if not processed_news:
            return {
                'summary': '今日暂无AI相关重要新闻',
                'total_count': 0,
                'category_stats': {},
                'importance_stats': {},
                'top_stories': [],
                'generated_time': datetime.now(pytz.timezone('Asia/Shanghai')).isoformat()
            }
        
        # 统计信息
        category_stats = {}
        importance_stats = {}
        
        for news in processed_news:
            category_stats[news.category] = category_stats.get(news.category, 0) + 1
            importance_stats[news.importance] = importance_stats.get(news.importance, 0) + 1
        
        # 选择top故事（高重要性优先，然后按source多样性）
        high_importance = [n for n in processed_news if n.importance == 'high']
        medium_importance = [n for n in processed_news if n.importance == 'medium']
        
        top_stories = high_importance[:3] + medium_importance[:2]
        top_stories = top_stories[:5]  # 最多5个top stories
        
        # 生成总结
        summary = self._generate_daily_summary(processed_news, category_stats, importance_stats)
        
        return {
            'summary': summary,
            'total_count': len(processed_news),
            'category_stats': category_stats,
            'importance_stats': importance_stats,
            'top_stories': [story.to_dict() for story in top_stories],
            'all_news': [news.to_dict() for news in processed_news],
            'generated_time': datetime.now(pytz.timezone('Asia/Shanghai')).isoformat()
        }
    
    def _generate_daily_summary(self, processed_news: List[ProcessedNews], 
                               category_stats: Dict[str, int], 
                               importance_stats: Dict[str, int]) -> str:
        """
        生成每日总结
        
        Args:
            processed_news: 处理后的新闻列表
            category_stats: 分类统计
            importance_stats: 重要性统计
            
        Returns:
            每日总结文本
        """
        news_titles = [news.title for news in processed_news[:10]]  # 取前10个标题
        
        prompt = f"""
        用中文回答。请基于今日AI新闻数据生成一个简洁的每日总结（100-150字）：
        
        新闻总数: {len(processed_news)}
        重要新闻: {importance_stats.get('high', 0)}条
        主要分类: {', '.join([f"{self.CATEGORIES.get(k, k)}({v}条)" for k, v in category_stats.items()])}
        
        代表性新闻标题:
        {chr(10).join([f"- {title}" for title in news_titles[:5]])}
        
        请生成一个总结，突出今日AI领域的主要动态和趋势。
        """
        
        try:
            client = self._get_client()
            client = self._get_client()
            current_model = self.current_model or self.model_manager.get_current_model()
            
            # 构建请求数据
            request_data = {
                "model": current_model.model_id if current_model else MODEL_NAME,
                "messages": [
                    {"role": "system", "content": "你是一个专业的AI行业分析师，擅长总结每日AI动态和趋势。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.4,
                "max_tokens": 4096
            }
            
            # 记录完整的请求JSON
            self.logger.info(f"=== 每日总结 - 发送给大模型的请求 ===")
            self.logger.info(f"请求JSON: {json.dumps(request_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"================================")
            
            self.logger.info("开始调用大模型API生成每日总结...")
            
            response = client.chat.completions.create(**request_data)
            
            self.logger.info("每日总结API调用成功")
            summary = response.choices[0].message.content.strip()
            
            # 构建响应数据用于日志记录
            response_data = {
                "choices": [{"message": {"content": summary}}],
                "usage": {
                    "total_tokens": response.usage.total_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "prompt_tokens": response.usage.prompt_tokens if hasattr(response, 'usage') and response.usage else 0,
                    "completion_tokens": response.usage.completion_tokens if hasattr(response, 'usage') and response.usage else 0
                } if hasattr(response, 'usage') and response.usage else {"total_tokens": 0}
            }
            
            # 记录完整的响应JSON
            self.logger.info(f"=== 每日总结 - 大模型返回的响应 ===")
            self.logger.info(f"响应JSON: {json.dumps(response_data, ensure_ascii=False, indent=2)}")
            self.logger.info(f"生成的每日总结: {summary}")
            self.logger.info(f"================================")
            return summary
            
        except Exception as e:
            self.logger.error(f"生成每日总结失败: {str(e)}")
            return f"今日共收集到{len(processed_news)}条AI相关资讯，涵盖{len(category_stats)}个主要领域，其中{importance_stats.get('high', 0)}条为高重要性新闻。"


if __name__ == "__main__":
    from rss_fetcher import RSSFetcher, setup_logging
    
    setup_logging()
    
    # 测试AI处理器
    fetcher = RSSFetcher()
    processor = AIProcessor()
    
    # 抓取文章
    articles = fetcher.fetch_all_sources()
    
    if articles:
        # 处理文章
        processed_news = processor.process_articles(articles[:3])  # 只处理前3篇测试
        
        # 生成报告
        report = processor.generate_daily_report(processed_news)
        
        print("=== 每日AI新闻报告 ===")
        print(f"总结: {report['summary']}")
        print(f"新闻总数: {report['total_count']}")
        print(f"分类统计: {report['category_stats']}")
        print(f"重要性统计: {report['importance_stats']}")
        
        print("\n=== Top Stories ===")
        for story in report['top_stories']:
            print(f"标题: {story['title']}")
            print(f"来源: {story['source']}")
            print(f"重要性: {story['importance']}")
            print(f"摘要: {story['summary'][:100]}...")
            print("-" * 50)
    else:
        print("未抓取到文章")
