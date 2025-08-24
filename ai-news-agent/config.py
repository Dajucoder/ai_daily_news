"""
AI新闻代理配置文件
"""
import os
from typing import List, Dict, Any
from pathlib import Path

# 加载.env文件
def load_env():
    """加载.env文件中的环境变量"""
    env_path = Path(__file__).parent / '.env'
    if env_path.exists():
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()

# 加载环境变量
load_env()

# RSS源配置
RSS_SOURCES = [
    {
        "name": "Hugging Face博客",
        "url": "https://huggingface.co/blog/feed.xml",
        "description": "Hugging Face官方博客，包含最新的AI模型和技术发布"
    },
    {
        "name": "Reddit机器学习",
        "url": "https://www.reddit.com/r/MachineLearning/.rss",
        "description": "Reddit机器学习社区热门讨论"
    },
    {
        "name": "MIT Tech Review",
        "url": "https://www.technologyreview.com/feed/",
        "description": "MIT科技评论科技新闻"
    },
    {
        "name": "OpenAI博客",
        "url": "https://openai.com/blog/rss.xml",
        "description": "OpenAI官方博客"
    },
    {
        "name": "DeepMind博客",
        "url": "https://deepmind.com/blog/feed/basic/",
        "description": "DeepMind官方博客"
    }
]

# AI模型配置 - 使用硅基流动
SILICONFLOW_API_KEY = os.getenv("SILICONFLOW_API_KEY", "")
SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

# 请求配置
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3
RETRY_DELAY = 2

# 内容过滤配置
MAX_ARTICLES_PER_SOURCE = 10
MIN_CONTENT_LENGTH = 50
MAX_CONTENT_LENGTH = 10000

# 时间配置
TIMEZONE = "Asia/Shanghai"
DEFAULT_FETCH_HOURS = [9, 14, 18]  # 默认抓取时间点

# 输出配置
OUTPUT_FORMAT = "json"
LOG_LEVEL = "INFO"
