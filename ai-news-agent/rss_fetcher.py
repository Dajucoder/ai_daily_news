"""
RSS新闻抓取器
"""
import feedparser
import requests
import logging
import time
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from dateutil import parser as date_parser
import pytz

from config import RSS_SOURCES, REQUEST_TIMEOUT, MAX_RETRIES, RETRY_DELAY, MAX_ARTICLES_PER_SOURCE


@dataclass
class RSSArticle:
    """RSS文章数据结构"""
    title: str
    summary: str
    link: str
    source: str
    source_description: str
    published_date: Optional[datetime] = None
    content: str = ""
    tags: List[str] = None
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


class RSSFetcher:
    """RSS抓取器"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.session = requests.Session()
        self.session.timeout = REQUEST_TIMEOUT
        
        # 设置用户代理
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def fetch_all_sources(self, target_date: Optional[date] = None) -> List[RSSArticle]:
        """
        从所有RSS源抓取文章
        
        Args:
            target_date: 目标日期，如果为None则抓取今天的文章
            
        Returns:
            抓取到的文章列表
        """
        if target_date is None:
            target_date = date.today()
        
        self.logger.info(f"开始抓取 {target_date} 的AI资讯")
        
        all_articles = []
        
        for source_config in RSS_SOURCES:
            try:
                self.logger.info(f"正在抓取: {source_config['name']}")
                articles = self._fetch_source(source_config, target_date)
                all_articles.extend(articles)
                self.logger.info(f"从 {source_config['name']} 抓取到 {len(articles)} 篇文章")
                
                # 避免过于频繁的请求
                time.sleep(1)
                
            except Exception as e:
                self.logger.error(f"抓取 {source_config['name']} 失败: {str(e)}")
                continue
        
        self.logger.info(f"总共抓取到 {len(all_articles)} 篇文章")
        return all_articles
    
    def _fetch_source(self, source_config: Dict[str, str], target_date: date) -> List[RSSArticle]:
        """
        从单个RSS源抓取文章
        
        Args:
            source_config: RSS源配置
            target_date: 目标日期
            
        Returns:
            从该源抓取到的文章列表
        """
        articles = []
        
        try:
            # 解析RSS feed
            feed = feedparser.parse(source_config['url'])
            
            if feed.bozo:
                self.logger.warning(f"RSS解析警告 {source_config['name']}: {feed.bozo_exception}")
            
            # 处理每个条目
            for entry in feed.entries[:MAX_ARTICLES_PER_SOURCE]:
                try:
                    article = self._parse_entry(entry, source_config, target_date)
                    if article:
                        articles.append(article)
                except Exception as e:
                    self.logger.error(f"解析条目失败: {str(e)}")
                    continue
            
        except Exception as e:
            self.logger.error(f"获取RSS feed失败 {source_config['name']}: {str(e)}")
            raise
        
        return articles
    
    def _parse_entry(self, entry: Any, source_config: Dict[str, str], target_date: date) -> Optional[RSSArticle]:
        """
        解析RSS条目
        
        Args:
            entry: feedparser解析的条目
            source_config: RSS源配置
            target_date: 目标日期
            
        Returns:
            解析后的文章对象，如果不符合条件则返回None
        """
        try:
            # 解析发布时间
            published_date = None
            if hasattr(entry, 'published'):
                try:
                    published_date = date_parser.parse(entry.published)
                except:
                    pass
            elif hasattr(entry, 'updated'):
                try:
                    published_date = date_parser.parse(entry.updated)
                except:
                    pass
            elif hasattr(entry, 'published_parsed') and entry.published_parsed:
                try:
                    published_date = datetime(*entry.published_parsed[:6])
                except:
                    pass
            
            # 放宽时间检查：允许最近3天的文章
            if published_date:
                days_diff = abs((published_date.date() - target_date).days)
                if days_diff > 3:  # 超过3天的文章才过滤掉
                    return None
            else:
                # 如果没有时间信息，保留文章
                self.logger.info(f"文章无发布时间信息，保留处理: {getattr(entry, 'title', 'Unknown')[:50]}")
            
            # 提取文章信息
            title = getattr(entry, 'title', '').strip()
            summary = getattr(entry, 'summary', '').strip()
            link = getattr(entry, 'link', '')
            
            # 基本验证
            if not title or not link:
                return None
            
            # 提取内容
            content = summary
            if hasattr(entry, 'content') and entry.content:
                # 获取第一个content条目
                if isinstance(entry.content, list) and len(entry.content) > 0:
                    content = entry.content[0].get('value', summary)
                else:
                    content = str(entry.content)
            
            # 提取标签
            tags = []
            if hasattr(entry, 'tags'):
                tags = [tag.get('term', '') for tag in entry.tags if tag.get('term')]
            
            article = RSSArticle(
                title=title,
                summary=summary,
                link=link,
                source=source_config['name'],
                source_description=source_config['description'],
                published_date=published_date,
                content=content,
                tags=tags
            )
            
            return article
            
        except Exception as e:
            self.logger.error(f"解析RSS条目失败: {str(e)}")
            return None
    
    def fetch_source_by_name(self, source_name: str, target_date: Optional[date] = None) -> List[RSSArticle]:
        """
        根据源名称抓取特定RSS源
        
        Args:
            source_name: RSS源名称
            target_date: 目标日期
            
        Returns:
            抓取到的文章列表
        """
        if target_date is None:
            target_date = date.today()
        
        source_config = None
        for config in RSS_SOURCES:
            if config['name'] == source_name:
                source_config = config
                break
        
        if not source_config:
            raise ValueError(f"未找到RSS源: {source_name}")
        
        return self._fetch_source(source_config, target_date)
    
    def get_available_sources(self) -> List[Dict[str, str]]:
        """
        获取可用的RSS源列表
        
        Returns:
            RSS源配置列表
        """
        return RSS_SOURCES.copy()


def setup_logging(level: str = "INFO"):
    """设置日志"""
    logging.basicConfig(
        level=getattr(logging, level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('rss_fetcher.log', encoding='utf-8')
        ]
    )


if __name__ == "__main__":
    setup_logging()
    
    fetcher = RSSFetcher()
    articles = fetcher.fetch_all_sources()
    
    print(f"抓取到 {len(articles)} 篇文章")
    for article in articles[:5]:  # 显示前5篇
        print(f"标题: {article.title}")
        print(f"来源: {article.source}")
        print(f"时间: {article.published_date}")
        print(f"链接: {article.link}")
        print("-" * 50)
