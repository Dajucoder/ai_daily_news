import os
import json
import logging
import threading
import time
import pytz
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

import requests
from django.conf import settings
from django.utils import timezone

from .models import NewsItem, FetchHistory

# 设置上海时区
SHANGHAI_TZ = pytz.timezone('Asia/Shanghai')


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
    source_description: str = ""
    tags: List[str] = None

    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class NewsAgentClient:
    """AI新闻代理客户端"""
    
    def __init__(self):
        # AI新闻代理服务器地址
        self.base_url = getattr(settings, 'NEWS_AGENT_BASE_URL', 'http://localhost:5001')
        self.session = requests.Session()
        self.session.timeout = None  # 移除超时限制
        self.logger = logging.getLogger(__name__)
    
    def fetch_news_from_agent(self, target_date: Optional[str] = None, force_refresh: bool = False) -> Dict[str, Any]:
        """
        从AI新闻代理获取新闻
        
        Args:
            target_date: 目标日期 (YYYY-MM-DD)，None表示今天
            force_refresh: 是否强制刷新
            
        Returns:
            API响应数据
        """
        try:
            # 调用AI新闻代理的抓取接口
            payload = {}
            if target_date:
                payload['date'] = target_date
            if force_refresh:
                payload['force_refresh'] = True
            
            response = self.session.post(
                f"{self.base_url}/api/fetch-news",
                json=payload
            )
            
            if response.status_code == 409:
                # 正在抓取中
                return {'status': 'fetching', 'message': '正在抓取新闻，请稍后查询状态'}
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"调用新闻代理失败: {str(e)}")
            raise Exception(f"无法连接到AI新闻代理服务: {str(e)}")
    
    def get_fetch_status(self) -> Dict[str, Any]:
        """获取抓取状态"""
        try:
            response = self.session.get(f"{self.base_url}/api/fetch-status")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.logger.error(f"获取抓取状态失败: {str(e)}")
            return {
                'is_fetching': False,
                'progress': 0,
                'message': f'无法获取状态: {str(e)}',
                'last_error': str(e)
            }
    
    def get_structured_news(self, target_date: Optional[str] = None) -> Dict[str, Any]:
        """
        获取结构化新闻数据
        
        Args:
            target_date: 目标日期 (YYYY-MM-DD)
            
        Returns:
            结构化新闻数据
        """
        try:
            params = {}
            if target_date:
                params['date'] = target_date
            
            response = self.session.get(
                f"{self.base_url}/api/news/structured",
                params=params
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.logger.error(f"获取结构化新闻失败: {str(e)}")
            raise Exception(f"无法获取新闻数据: {str(e)}")
    
    def check_health(self) -> bool:
        """检查AI新闻代理服务健康状态"""
        try:
            response = self.session.get(f"{self.base_url}/api/health")
            return response.status_code == 200
        except:
            return False


class NewsService:
    """新闻服务"""
    
    _fetch_status = {
        'is_fetching': False,
        'progress': 0,
        'message': '状态已重置',
        'start_time': None,
        'estimated_completion': None
    }
    _fetch_lock = threading.Lock()
    
    def __init__(self):
        self.agent_client = NewsAgentClient()
        self.logger = logging.getLogger(__name__)
    
    def is_fetching(self) -> bool:
        """检查是否正在获取"""
        return self._fetch_status['is_fetching']
    
    def get_fetch_status(self) -> Dict[str, Any]:
        """获取获取状态"""
        # 总是检查AI代理的最新状态
        agent_status = self.agent_client.get_fetch_status()
        
        # 如果AI代理正在抓取，更新本地状态
        if agent_status.get('is_fetching', False):
            with self._fetch_lock:
                self._fetch_status.update({
                    'is_fetching': True,
                    'progress': agent_status.get('progress', 0),
                    'message': agent_status.get('message', '正在抓取...'),
                    'start_time': agent_status.get('start_time'),
                    'estimated_completion': None
                })
        else:
            # AI代理已完成，更新本地状态
            if self._fetch_status['is_fetching']:
                with self._fetch_lock:
                    self._fetch_status.update({
                        'is_fetching': False,
                        'progress': agent_status.get('progress', 100),
                        'message': agent_status.get('message', '完成！'),
                        'estimated_completion': None
                    })
        
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
        
        # 检查AI代理服务状态
        if not self.agent_client.check_health():
            raise Exception("AI新闻代理服务不可用，请检查服务是否启动")
        
        def fetch_task():
            with self._fetch_lock:
                shanghai_now = timezone.now().astimezone(SHANGHAI_TZ)
                self._fetch_status.update({
                    'is_fetching': True,
                    'progress': 0,
                    'message': '开始获取新闻...',
                    'start_time': shanghai_now,
                    'estimated_completion': shanghai_now + timedelta(minutes=5)
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
            # 使用上海时区获取当前日期
            shanghai_now = timezone.now().astimezone(SHANGHAI_TZ)
            today_str = shanghai_now.date().strftime('%Y-%m-%d')
            
            # 调用AI新闻代理
            self._update_status(10, '调用AI新闻代理...')
            agent_response = self.agent_client.fetch_news_from_agent(
                target_date=today_str, 
                force_refresh=True
            )
            
            if agent_response.get('status') == 'fetching':
                # AI代理正在抓取，等待完成
                self._update_status(20, 'AI代理正在抓取新闻，等待完成...')
                self._wait_for_agent_completion()
            else:
                # 如果代理立即开始抓取，也等待一下
                self._update_status(20, '等待AI代理完成抓取...')
                time.sleep(3)  # 给代理一点启动时间
                self._wait_for_agent_completion()
            
            # 等待一段时间确保数据已保存
            self._update_status(65, '等待数据处理完成...')
            time.sleep(5)
            
            # 获取结构化新闻数据
            self._update_status(70, '获取结构化新闻数据...')
            news_data = self.agent_client.get_structured_news(today_str)
            
            if not news_data.get('news_items'):
                # 如果今日没有数据，尝试获取昨日数据
                yesterday_str = (shanghai_now.date() - timedelta(days=1)).strftime('%Y-%m-%d')
                self._update_status(75, '尝试获取昨日新闻数据...')
                news_data = self.agent_client.get_structured_news(yesterday_str)
                
                if not news_data.get('news_items'):
                    # 即使没有新闻，也要等到最后再记录历史
                    self._update_status(95, '记录获取历史...')
                    self._record_fetch_history(0, 'success', '最近暂无新闻')
                    
                    # 完成
                    with self._fetch_lock:
                        self._fetch_status.update({
                            'is_fetching': False,
                            'progress': 100,
                            'message': '最近暂无新闻'
                        })
                    return
            
            # 保存到数据库 - 保存所有处理过的新闻，不受max_news_count限制
            self._update_status(85, '保存到数据库...')
            all_news_items = news_data['news_items']
            self.logger.info(f"AI代理处理了{len(all_news_items)}篇新闻，准备全部保存到数据库")
            saved_count = self._save_agent_news_items(all_news_items)
            
            # 记录历史 - 只在所有处理完成后记录
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
            # 异常情况下也要在最后记录历史
            with self._fetch_lock:
                self._fetch_status.update({
                    'is_fetching': False,
                    'progress': 0,
                    'message': f'获取失败: {str(e)}'
                })
            self._record_fetch_history(0, 'failed', str(e))
            raise
    
    def _wait_for_agent_completion(self):
        """等待AI代理完成抓取 - 无超时版本，确保完全完成后才继续"""
        check_interval = 2  # 每2秒检查一次
        
        self.logger.info("开始等待AI代理完成抓取...")
        
        while True:
            try:
                status = self.agent_client.get_fetch_status()
                
                # 获取状态信息
                is_fetching = status.get('is_fetching', False)
                progress = status.get('progress', 0)
                message = status.get('message', '等待AI代理完成...')
                
                # 更新Django后端的进度显示
                self._update_status(30 + min(60, progress), f"AI代理: {message} ({progress}%)")
                
                self.logger.info(f"AI代理状态: is_fetching={is_fetching}, progress={progress}%, message={message}")
                
                # 严格判断：必须同时满足以下条件才认为完成
                # 1. is_fetching = False (不在抓取状态)
                # 2. progress = 100 (进度100%)
                # 3. message不包含"处理中"、"抓取"、"分析"等关键词
                if (not is_fetching and 
                    progress >= 100 and 
                    not any(keyword in message.lower() for keyword in ['处理中', '抓取', '分析', 'processing', 'fetching', 'analyzing'])):
                    
                    self.logger.info(f"AI代理完全完成！状态: is_fetching={is_fetching}, progress={progress}%, message={message}")
                    # 额外等待3秒确保文件已完全写入
                    time.sleep(3)
                    return
                
                time.sleep(check_interval)
                
            except Exception as e:
                self.logger.warning(f"检查AI代理状态时出错: {e}")
                # 出错时等待一下再重试，而不是立即退出
                time.sleep(check_interval)
                continue
    
    def _save_agent_news_items(self, news_items: List[Dict[str, Any]]) -> int:
        """保存来自AI代理的新闻条目，如果链接相同但其他字段不同则覆盖更新"""
        saved_count = 0
        updated_count = 0
        
        self.logger.info(f"开始保存{len(news_items)}篇新闻到数据库")
        
        for item in news_items:
            try:
                # 获取原文链接
                original_link = item.get('original_link', '') or item.get('url', '')
                
                # 解析时间，确保使用上海时区
                timestamp = timezone.now().astimezone(SHANGHAI_TZ)
                if item.get('timestamp'):
                    try:
                        timestamp = datetime.fromisoformat(item['timestamp'].replace('Z', '+00:00'))
                        if timezone.is_naive(timestamp):
                            timestamp = timezone.make_aware(timestamp, SHANGHAI_TZ)
                        else:
                            timestamp = timestamp.astimezone(SHANGHAI_TZ)
                    except:
                        pass
                
                # 主要基于原文链接查找和更新
                if original_link:
                    existing_by_url = NewsItem.objects.filter(url=original_link).first()
                    if existing_by_url:
                        # 检查是否有字段不同，如果有则更新
                        needs_update = False
                        update_fields = []
                        
                        # 比较各个字段
                        if existing_by_url.title != item['title']:
                            existing_by_url.title = item['title']
                            update_fields.append('title')
                            needs_update = True
                            
                        if existing_by_url.source != item['source']:
                            existing_by_url.source = item['source']
                            update_fields.append('source')
                            needs_update = True
                            
                        if existing_by_url.content != item['content']:
                            existing_by_url.content = item['content']
                            update_fields.append('content')
                            needs_update = True
                            
                        if existing_by_url.summary != item['summary']:
                            existing_by_url.summary = item['summary']
                            update_fields.append('summary')
                            needs_update = True
                            
                        if existing_by_url.category != item.get('category', 'other'):
                            existing_by_url.category = item.get('category', 'other')
                            update_fields.append('category')
                            needs_update = True
                            
                        if existing_by_url.importance != item.get('importance', 'medium'):
                            existing_by_url.importance = item.get('importance', 'medium')
                            update_fields.append('importance')
                            needs_update = True
                            
                        if existing_by_url.key_points != item.get('key_points', []):
                            existing_by_url.key_points = item.get('key_points', [])
                            update_fields.append('key_points')
                            needs_update = True
                            
                        # 比较获取时间（timestamp）
                        if existing_by_url.timestamp != timestamp:
                            existing_by_url.timestamp = timestamp
                            update_fields.append('timestamp')
                            needs_update = True
                        
                        if needs_update:
                            # 更新修改时间，使用上海时区
                            existing_by_url.updated_at = timezone.now().astimezone(SHANGHAI_TZ)
                            update_fields.append('updated_at')
                            
                            # 保存更新
                            existing_by_url.save(update_fields=update_fields)
                            updated_count += 1
                            self.logger.info(f"更新新闻: {existing_by_url.title[:50]}... (URL: {original_link}, 更新字段: {', '.join(update_fields)})")
                        else:
                            self.logger.info(f"新闻无变化，跳过: {existing_by_url.title[:50]}... (URL: {original_link})")
                        continue
                
                # 如果没有原文链接，则基于标题和来源查找和更新
                if not original_link:
                    existing_by_title = NewsItem.objects.filter(
                        title=item['title'],
                        source=item['source']
                    ).first()
                    if existing_by_title:
                        # 同样进行字段比较和更新
                        needs_update = False
                        update_fields = []
                        
                        if existing_by_title.content != item['content']:
                            existing_by_title.content = item['content']
                            update_fields.append('content')
                            needs_update = True
                            
                        if existing_by_title.summary != item['summary']:
                            existing_by_title.summary = item['summary']
                            update_fields.append('summary')
                            needs_update = True
                            
                        if existing_by_title.category != item.get('category', 'other'):
                            existing_by_title.category = item.get('category', 'other')
                            update_fields.append('category')
                            needs_update = True
                            
                        if existing_by_title.importance != item.get('importance', 'medium'):
                            existing_by_title.importance = item.get('importance', 'medium')
                            update_fields.append('importance')
                            needs_update = True
                            
                        if existing_by_title.key_points != item.get('key_points', []):
                            existing_by_title.key_points = item.get('key_points', [])
                            update_fields.append('key_points')
                            needs_update = True
                            
                        # 比较获取时间（timestamp）
                        if existing_by_title.timestamp != timestamp:
                            existing_by_title.timestamp = timestamp
                            update_fields.append('timestamp')
                            needs_update = True
                        
                        if needs_update:
                            existing_by_title.updated_at = timezone.now().astimezone(SHANGHAI_TZ)
                            update_fields.append('updated_at')
                            existing_by_title.save(update_fields=update_fields)
                            updated_count += 1
                            self.logger.info(f"更新新闻(基于标题): {item['title'][:50]}... (更新字段: {', '.join(update_fields)})")
                        else:
                            self.logger.info(f"新闻无变化，跳过(基于标题): {item['title'][:50]}...")
                        continue
                
                # 创建新的新闻记录
                news_item = NewsItem.objects.create(
                    title=item['title'],
                    source=item['source'],
                    content=item['content'],
                    summary=item['summary'],
                    url=original_link,  # 确保保存原文链接
                    category=item.get('category', 'other'),
                    importance=item.get('importance', 'medium'),
                    key_points=item.get('key_points', []),
                    timestamp=timestamp
                )
                saved_count += 1
                self.logger.info(f"保存新闻成功: {news_item.title[:50]}... (URL: {original_link})")
                
            except Exception as e:
                self.logger.error(f"保存新闻失败: {str(e)}")
                continue
        
        self.logger.info(f"数据库保存完成，成功保存{saved_count}篇新闻，更新{updated_count}篇新闻")
        return saved_count + updated_count
    
    def _record_fetch_history(self, news_count: int, status: str, log_message: str = ''):
        """记录获取历史"""
        try:
            # 使用上海时区获取当前日期
            today = timezone.now().astimezone(SHANGHAI_TZ).date()
            
            history = FetchHistory.objects.create(
                fetch_date=today,
                news_count=news_count,
                status=status,
                log_message=log_message
            )
            
            self.logger.info(f"创建获取历史记录: {history}")
            
        except Exception as e:
            self.logger.error(f"记录获取历史失败: {str(e)}")
    
    def save_news_from_agent_data(self, agent_data: Dict[str, Any]) -> int:
        """
        从AI代理返回的数据中保存新闻到数据库
        
        Args:
            agent_data: AI代理返回的结构化数据
            
        Returns:
            保存的新闻数量
        """
        if not agent_data or not agent_data.get('news_items'):
            self.logger.warning("AI代理数据为空或没有新闻条目")
            return 0
        
        news_items = agent_data['news_items']
        self.logger.info(f"开始保存AI代理返回的{len(news_items)}篇新闻")
        
        return self._save_agent_news_items(news_items)
    
    def get_agent_status(self) -> Dict[str, Any]:
        """获取AI代理状态信息"""
        try:
            health_status = self.agent_client.check_health()
            
            if health_status:
                # 获取详细状态
                fetch_status = self.agent_client.get_fetch_status()
                return {
                    'available': True,
                    'status': 'healthy',
                    'is_fetching': fetch_status.get('is_fetching', False),
                    'last_message': fetch_status.get('message', 'Ready'),
                    'progress': fetch_status.get('progress', 0)
                }
            else:
                return {
                    'available': False,
                    'status': 'unavailable',
                    'message': 'AI新闻代理服务不可用'
                }
        except Exception as e:
            return {
                'available': False,
                'status': 'error',
                'message': f'检查代理状态失败: {str(e)}'
            }


# 向后兼容的类和方法（保留原有的AIClient等类名，但使用新的实现）
class AIClient:
    """向后兼容的AI客户端类"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.news_service = NewsService()
    
    def generate_news_topics(self, count: int = 5) -> List[str]:
        """生成新闻话题（向后兼容方法）"""
        # 这个方法现在由AI代理内部处理，返回默认话题
        return [
            "大语言模型最新进展",
            "AI芯片技术突破", 
            "自动驾驶技术更新",
            "AI在医疗领域应用",
            "AI监管政策动态"
        ][:count]
    
    def analyze_news_content(self, topic: str, raw_content: str) -> Dict[str, Any]:
        """分析新闻内容（向后兼容方法）"""
        # 这个方法现在由AI代理内部处理
        return {
            "title": f"关于{topic}的最新资讯",
            "source": "AI科技资讯网",
            "summary": f"关于{topic}的重要进展和最新动态。",
            "key_points": ["技术创新", "应用拓展", "产业发展"],
            "category": "other",
            "importance": "medium"
        }


class NewsContentGenerator:
    """向后兼容的新闻内容生成器"""
    
    def generate_mock_content(self, topic: str) -> str:
        """生成模拟新闻内容（向后兼容方法）"""
        return f"关于{topic}的最新资讯内容由AI新闻代理生成。"