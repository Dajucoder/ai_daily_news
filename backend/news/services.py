import os
import json
import logging
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import requests
from django.conf import settings
from django.utils import timezone
from openai import OpenAI

from .models import NewsItem, FetchHistory


@dataclass
class NewsData:
    """新闻数据结构"""
    title: str
    source: str
    content: str
    summary: str
    category: str
    importance: str
    key_points: List[str]
    url: Optional[str] = None


class AIClient:
    """AI客户端"""
    
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.SILICONFLOW_API_KEY,
            base_url=settings.SILICONFLOW_BASE_URL
        )
        self.model_name = settings.MODEL_NAME
        self.logger = logging.getLogger(__name__)
    
    def generate_news_topics(self, count: int = 5) -> List[str]:
        """生成新闻话题"""
        current_date = datetime.now().strftime("%Y年%m月%d日")
        
        prompt = f"""
        请为{current_date}生成{count}个当前AI领域最热门和最重要的资讯话题。
        这些话题应该涵盖：
        1. 最新的AI技术突破
        2. 重要的AI产品发布
        3. AI行业动态和政策
        4. AI应用案例
        5. AI研究进展
        
        请以JSON数组格式返回：
        ["话题1", "话题2", "话题3", ...]
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "你是一个AI资讯专家，了解最新的AI发展动态。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800
            )
            
            content = response.choices[0].message.content.strip()
            topics = json.loads(content)
            
            return topics[:count]
            
        except Exception as e:
            self.logger.error(f"生成新闻话题失败: {str(e)}")
            # 返回默认话题
            return [
                "大语言模型最新进展",
                "AI芯片技术突破", 
                "自动驾驶技术更新",
                "AI在医疗领域应用",
                "AI监管政策动态"
            ][:count]
    
    def analyze_news_content(self, topic: str, raw_content: str) -> Dict[str, Any]:
        """分析新闻内容"""
        prompt = f"""
        请分析以下关于"{topic}"的AI领域资讯内容，并按照以下JSON格式输出结构化摘要：
        
        {{
            "title": "资讯标题",
            "source": "资讯来源",
            "summary": "关键内容摘要（100-200字）",
            "key_points": ["关键点1", "关键点2", "关键点3"],
            "category": "资讯分类",
            "importance": "重要程度（high/medium/low）"
        }}
        
        资讯分类选项：tech_breakthrough, product_release, industry_news, policy_regulation, research_progress, application_case, other
        
        原始内容：
        {raw_content}
        
        请确保输出为有效的JSON格式。
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "你是一个专业的AI资讯分析师，擅长提取和总结AI领域的重要信息。"},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content.strip()
            
            # 尝试解析JSON
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                # 如果不是有效JSON，尝试提取JSON部分
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    result = json.loads(json_match.group())
                    return result
                else:
                    raise ValueError("无法解析API返回的JSON内容")
                    
        except Exception as e:
            self.logger.error(f"分析新闻内容失败: {str(e)}")
            # 返回默认结果
            return {
                "title": f"关于{topic}的最新资讯",
                "source": "AI科技资讯网",
                "summary": f"关于{topic}的重要进展和最新动态。",
                "key_points": ["技术创新", "应用拓展", "产业发展"],
                "category": "other",
                "importance": "medium"
            }


class NewsContentGenerator:
    """新闻内容生成器"""
    
    def generate_mock_content(self, topic: str) -> str:
        """生成模拟新闻内容"""
        return f"""
        关于"{topic}"的最新资讯：
        
        据最新报道，{topic}领域出现了重要进展。业内专家表示，这一发展将对AI行业产生深远影响。
        
        主要亮点包括：
        1. 技术创新突破了传统限制
        2. 应用场景得到进一步拓展  
        3. 产业化进程明显加速
        4. 相关标准和规范正在完善
        
        多家知名科技公司已经开始布局相关技术，预计未来6个月内将有更多产品和服务推出。
        
        行业分析师认为，这一趋势将推动整个AI生态系统的发展，为用户带来更好的体验。
        
        该技术的应用前景广阔，预计将在教育、医疗、金融、制造等多个领域产生重要影响。
        相关企业和研究机构正在加大投入，推动技术的进一步发展和商业化应用。
        """


class NewsService:
    """新闻服务"""
    
    _fetch_status = {
        'is_fetching': False,
        'progress': 0,
        'message': '',
        'start_time': None,
        'estimated_completion': None
    }
    _fetch_lock = threading.Lock()
    
    def __init__(self):
        self.ai_client = AIClient()
        self.content_generator = NewsContentGenerator()
        self.logger = logging.getLogger(__name__)
    
    def is_fetching(self) -> bool:
        """检查是否正在获取"""
        return self._fetch_status['is_fetching']
    
    def get_fetch_status(self) -> Dict[str, Any]:
        """获取获取状态"""
        return self._fetch_status.copy()
    
    def _update_status(self, progress: int, message: str):
        """更新状态"""
        with self._fetch_lock:
            self._fetch_status.update({
                'progress': progress,
                'message': message
            })
    
    def start_fetch_task(self, max_news_count: int = 5):
        """启动获取任务"""
        if self.is_fetching():
            raise Exception("正在获取新闻，请稍后再试")
        
        def fetch_task():
            with self._fetch_lock:
                self._fetch_status.update({
                    'is_fetching': True,
                    'progress': 0,
                    'message': '开始获取新闻...',
                    'start_time': timezone.now(),
                    'estimated_completion': timezone.now() + timedelta(minutes=5)
                })
            
            try:
                self._fetch_news_internal(max_news_count)
            except Exception as e:
                self.logger.error(f"获取新闻失败: {str(e)}")
                with self._fetch_lock:
                    self._fetch_status.update({
                        'is_fetching': False,
                        'progress': 0,
                        'message': f'获取失败: {str(e)}'
                    })
            finally:
                # 确保状态被重置
                if self._fetch_status['is_fetching']:
                    with self._fetch_lock:
                        self._fetch_status['is_fetching'] = False
        
        thread = threading.Thread(target=fetch_task)
        thread.daemon = True
        thread.start()
    
    def _fetch_news_internal(self, max_news_count: int):
        """内部获取新闻方法"""
        try:
            # 生成话题
            self._update_status(10, '生成新闻话题...')
            topics = self.ai_client.generate_news_topics(max_news_count)
            self.logger.info(f"生成了{len(topics)}个话题")
            
            # 处理每个话题
            news_items = []
            for i, topic in enumerate(topics):
                progress = 20 + (i * 60 // len(topics))
                self._update_status(progress, f'处理话题: {topic}')
                
                try:
                    # 生成内容
                    raw_content = self.content_generator.generate_mock_content(topic)
                    
                    # AI分析
                    analysis = self.ai_client.analyze_news_content(topic, raw_content)
                    
                    # 创建新闻数据
                    news_data = NewsData(
                        title=analysis.get('title', f'关于{topic}的最新资讯'),
                        source=analysis.get('source', 'AI科技资讯网'),
                        content=raw_content,
                        summary=analysis.get('summary', ''),
                        category=analysis.get('category', 'other'),
                        importance=analysis.get('importance', 'medium'),
                        key_points=analysis.get('key_points', []),
                        url=f"https://example.com/news/{i+1}"
                    )
                    
                    news_items.append(news_data)
                    
                    # 添加延迟避免API限制
                    time.sleep(1)
                    
                except Exception as e:
                    self.logger.error(f"处理话题'{topic}'失败: {str(e)}")
                    continue
            
            # 保存到数据库
            self._update_status(85, '保存到数据库...')
            saved_count = self._save_news_items(news_items)
            
            # 记录历史
            self._update_status(95, '记录获取历史...')
            self._record_fetch_history(saved_count, 'success')
            
            # 完成
            with self._fetch_lock:
                self._fetch_status.update({
                    'is_fetching': False,
                    'progress': 100,
                    'message': f'成功获取{saved_count}条新闻'
                })
            
            self.logger.info(f"成功获取并保存{saved_count}条新闻")
            
        except Exception as e:
            self.logger.error(f"获取新闻过程失败: {str(e)}")
            self._record_fetch_history(0, 'failed', str(e))
            raise
    
    def _save_news_items(self, news_items: List[NewsData]) -> int:
        """保存新闻条目"""
        saved_count = 0
        
        for news_data in news_items:
            try:
                news_item = NewsItem.objects.create(
                    title=news_data.title,
                    source=news_data.source,
                    content=news_data.content,
                    summary=news_data.summary,
                    url=news_data.url,
                    category=news_data.category,
                    importance=news_data.importance,
                    key_points=news_data.key_points,
                    timestamp=timezone.now()
                )
                saved_count += 1
                self.logger.info(f"保存新闻: {news_item.title}")
                
            except Exception as e:
                self.logger.error(f"保存新闻失败: {str(e)}")
                continue
        
        return saved_count
    
    def _record_fetch_history(self, news_count: int, status: str, log_message: str = ''):
        """记录获取历史"""
        try:
            today = timezone.now().date()
            
            # 更新或创建历史记录
            history, created = FetchHistory.objects.update_or_create(
                fetch_date=today,
                defaults={
                    'news_count': news_count,
                    'status': status,
                    'log_message': log_message
                }
            )
            
            action = "创建" if created else "更新"
            self.logger.info(f"{action}获取历史记录: {history}")
            
        except Exception as e:
            self.logger.error(f"记录获取历史失败: {str(e)}")