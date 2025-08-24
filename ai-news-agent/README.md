# AI新闻代理 (AI News Agent)

基于RSS源的AI资讯自动抓取和处理系统，使用大语言模型对内容进行智能分析和结构化输出。

## 功能特性

- 🔄 **多源RSS抓取**: 支持多个AI资讯RSS源同时抓取
- 🤖 **AI智能处理**: 使用Qwen大模型进行内容分析和结构化
- 📊 **分类整理**: 自动分类新闻类型和重要程度
- 🌐 **API服务**: 提供REST API接口供其他系统调用
- 📱 **灵活部署**: 支持命令行和API服务器两种运行模式

## RSS数据源

系统集成以下优质AI资讯源：

| 来源 | RSS地址 | 描述 |
|------|---------|------|
| Hugging Face博客 | https://huggingface.co/blog/feed.xml | 最新AI模型和技术发布 |
| ArXiv AI论文 | http://rss.arxiv.org/rss/cs.AI | 人工智能学术论文 |
| Reddit机器学习 | https://www.reddit.com/r/MachineLearning/.rss | 社区热门讨论 |
| MIT Tech Review | https://www.technologyreview.com/topic/artificial-intelligence/rss | 权威技术评论 |
| The Batch | https://landing.ai/the-batch/rss.xml | Andrew Ng的AI周报 |

## 快速开始

### 1. 环境准备

```bash
# 进入ai-news-agent目录
cd ai-news-agent

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境 (macOS/Linux)
source venv/bin/activate
# 或者 Windows
# venv\\Scripts\\activate

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置API密钥

```bash
# 设置硅基流动API密钥
export SILICONFLOW_API_KEY="your_api_key_here"
```

### 3. 运行方式

#### 方式一：使用启动脚本（推荐）

```bash
python start.py
```

然后选择运行模式：
- 1: 一次性抓取今日新闻
- 2: 启动API服务器
- 3: 安装/更新依赖

#### 方式二：直接运行

```bash
# 抓取今日新闻
python news_agent.py

# 抓取指定日期新闻
python news_agent.py --date 2024-01-15

# 显示最新报告
python news_agent.py --show-latest

# 启动API服务器
python api_server.py
```

## API接口

启动API服务器后，可通过以下接口访问：

### 基础接口

- `GET /api/health` - 健康检查
- `GET /api/sources` - 获取RSS源列表

### 新闻抓取

- `POST /api/fetch-news` - 开始抓取新闻
  ```json
  {
    "date": "2024-01-15",  // 可选，默认今天
    "force_refresh": false  // 可选，是否强制刷新
  }
  ```

- `GET /api/fetch-status` - 获取抓取状态

### 报告查询

- `GET /api/reports` - 获取所有报告列表
- `GET /api/reports/latest` - 获取最新报告
- `GET /api/reports/2024-01-15` - 获取指定日期报告
- `GET /api/news/structured` - 获取结构化新闻数据

## 输出格式

### 新闻数据结构

```json
{
  "title": "新闻标题",
  "source": "来源名称",
  "source_description": "来源描述", 
  "original_link": "原文链接",
  "summary": "AI生成的摘要",
  "content": "原始内容",
  "category": "分类代码",
  "importance": "重要程度",
  "key_points": ["关键点1", "关键点2"],
  "tags": ["标签1", "标签2"],
  "processed_time": "处理时间",
  "is_today_news": true
}
```

### 分类系统

- `tech_breakthrough`: 技术突破
- `product_release`: 产品发布
- `industry_news`: 行业动态
- `policy_regulation`: 政策法规
- `research_progress`: 研究进展
- `application_case`: 应用案例
- `other`: 其他

### 重要程度

- `high`: 高重要性
- `medium`: 中等重要性
- `low`: 低重要性

## 配置说明

主要配置在 `config.py` 文件中：

```python
# RSS源配置
RSS_SOURCES = [...]

# AI模型配置
SILICONFLOW_API_KEY = "your_api_key"
SILICONFLOW_BASE_URL = "https://api.siliconflow.cn/v1"
MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct"

# 请求配置
REQUEST_TIMEOUT = 30
MAX_RETRIES = 3
MAX_ARTICLES_PER_SOURCE = 10
```

## 与Django后端集成

系统提供标准化的API接口，可以轻松与Django后端集成：

1. 启动AI新闻代理API服务器（端口5001）
2. Django后端调用 `/api/news/structured` 接口获取结构化数据
3. 数据格式完全兼容Django的NewsItem模型

## 文件结构

```
ai-news-agent/
├── config.py              # 配置文件
├── rss_fetcher.py         # RSS抓取器
├── ai_processor.py        # AI内容处理器
├── news_agent.py          # 主程序
├── api_server.py          # API服务器
├── start.py              # 启动脚本
├── requirements.txt       # 依赖包
├── README.md             # 说明文档
├── output/               # 输出目录
│   ├── ai_news_report_20240115.json
│   └── ai_news_simplified_20240115.json
└── venv/                 # 虚拟环境
```

## 日志和调试

- 日志文件：`rss_fetcher.log`
- 可通过 `--log-level` 参数调整日志级别
- API服务器默认开启调试模式

## 注意事项

1. 确保网络环境可以访问RSS源
2. API密钥需要有足够的调用额度
3. 大模型响应可能需要一些时间，请耐心等待
4. 输出文件保存在 `output/` 目录下

## 故障排除

### 常见问题

1. **RSS抓取失败**
   - 检查网络连接
   - 确认RSS源地址可访问
   - 查看日志文件了解详细错误

2. **AI处理失败**
   - 检查API密钥是否正确
   - 确认账户余额充足
   - 检查模型名称是否正确

3. **依赖安装失败**
   - 升级pip: `pip install --upgrade pip`
   - 检查Python版本 (推荐3.8+)
   - 尝试使用国内镜像源

## 许可证

MIT License
