# API 文档

本文档提供 AI Daily News 智能新闻系统的完整 API 接口文档。

## 📋 目录

- [API概述](#api概述)
- [认证系统](#认证系统)
- [后端API接口](#后端api接口)
- [AI代理API接口](#ai代理api接口)
- [错误处理](#错误处理)
- [SDK和示例](#sdk和示例)

## 🌐 API概述

### 服务架构

AI Daily News 系统提供两套独立但协作的 API 服务：

- **后端API** (Django REST Framework): 处理用户管理、新闻数据、聊天功能等核心业务
- **AI代理API** (Flask): 专门处理RSS抓取、AI内容分析等智能服务

### 基础信息

**开发环境访问地址:**
- 后端API: `http://localhost:8000/api/`
- AI代理API: `http://localhost:5001/api/`
- API文档: `http://localhost:8000/api/schema/swagger-ui/`

**生产环境访问地址:**
- 后端API: `https://your-domain.com/api/`
- AI代理API: `https://your-domain.com/agent/api/`

### API特性

- **RESTful设计**: 遵循REST架构原则
- **JSON格式**: 统一使用JSON数据格式
- **JWT认证**: 基于Token的安全认证
- **分页支持**: 大数据集自动分页
- **错误标准化**: 统一的错误响应格式
- **版本控制**: 支持API版本管理
- **实时通信**: 支持WebSocket连接

## 🔐 认证系统

### JWT Token 认证

系统使用 JWT (JSON Web Token) 进行用户身份验证和授权。

#### 获取访问令牌

**端点:** `POST /api/auth/token/`

**请求体:**
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

**成功响应 (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com"
  }
}
```

#### 使用访问令牌

在所有需要认证的请求中，在请求头中包含访问令牌：

```http
Authorization: Bearer your_access_token
```

## 🔧 后端API接口

### 用户认证管理

#### 用户注册

**端点:** `POST /api/auth/register/`

**请求体:**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword123"
}
```

#### 获取用户资料

**端点:** `GET /api/auth/profile/`
**认证:** 必需

**成功响应 (200 OK):**
```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com",
  "avatar": "/media/avatars/user_avatar.jpg",
  "date_joined": "2024-01-15T10:30:00Z",
  "preferences": {
    "theme": "light",
    "language": "zh-cn",
    "notifications": true
  }
}
```

### 新闻管理

#### 获取新闻列表

**端点:** `GET /api/news/`
**认证:** 必需

**查询参数:**
- `page` (integer): 页码，默认为1
- `category` (string): 分类过滤
- `search` (string): 关键词搜索
- `date_from` (string): 开始日期，格式 YYYY-MM-DD
- `date_to` (string): 结束日期，格式 YYYY-MM-DD

**成功响应 (200 OK):**
```json
{
  "count": 150,
  "results": [
    {
      "id": 1,
      "title": "OpenAI发布GPT-4新版本",
      "summary": "OpenAI今日发布了GPT-4的最新版本...",
      "category": "tech_breakthrough",
      "importance": "high",
      "source": "OpenAI官方博客",
      "published_at": "2024-01-15T10:00:00Z",
      "key_points": ["性能提升20%", "支持更长的上下文"],
      "tags": ["GPT-4", "OpenAI", "AI"]
    }
  ]
}
```

#### 获取单条新闻详情

**端点:** `GET /api/news/{id}/`
**认证:** 必需

#### 新闻统计信息

**端点:** `GET /api/news/statistics/`
**认证:** 必需

**成功响应 (200 OK):**
```json
{
  "total_count": 1500,
  "today_count": 25,
  "categories": {
    "tech_breakthrough": 450,
    "industry_news": 380,
    "research_progress": 320
  },
  "importance_distribution": {
    "high": 300,
    "medium": 800,
    "low": 400
  }
}
```

### 聊天功能

#### 发送聊天消息

**端点:** `POST /api/chat/send/`
**认证:** 必需

**请求体:**
```json
{
  "message": "请分析一下今天的AI新闻趋势",
  "stream": true,
  "include_thinking": true
}
```

**成功响应 (200 OK):**
```json
{
  "id": 123,
  "message": "请分析一下今天的AI新闻趋势",
  "response": "根据今天的AI新闻分析，我发现以下几个重要趋势...",
  "thinking_process": "我需要分析今天的新闻数据...",
  "timestamp": "2024-01-15T14:30:00Z",
  "model_info": {
    "model_name": "Qwen/Qwen2.5-7B-Instruct",
    "temperature": 0.7,
    "tokens_used": 1250
  }
}
```

#### 获取聊天历史

**端点:** `GET /api/chat/history/`
**认证:** 必需

### AI配置管理

#### 获取AI配置

**端点:** `GET /api/ai-config/`
**认证:** 必需

#### 更新AI配置

**端点:** `PUT /api/ai-config/`
**认证:** 必需

## 🤖 AI代理API接口

### 系统状态

#### 健康检查

**端点:** `GET /api/health`

**成功响应 (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "service": "AI News Agent",
  "version": "1.0.0"
}
```

### RSS源管理

#### 获取RSS源列表

**端点:** `GET /api/sources`

**成功响应 (200 OK):**
```json
{
  "sources": [
    {
      "name": "Hugging Face博客",
      "url": "https://huggingface.co/blog/feed.xml",
      "description": "最新AI模型和技术发布",
      "enabled": true,
      "last_fetch": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 新闻抓取

#### 开始新闻抓取

**端点:** `POST /api/fetch-news`

**请求体:**
```json
{
  "date": "2024-01-15",
  "force_refresh": false
}
```

**成功响应 (202 Accepted):**
```json
{
  "message": "新闻抓取任务已启动",
  "task_id": "fetch_20240115_001",
  "target_date": "2024-01-15",
  "estimated_time": "5-10分钟"
}
```

#### 获取抓取状态

**端点:** `GET /api/fetch-status`

**成功响应 (200 OK):**
```json
{
  "is_fetching": true,
  "progress": 60,
  "current_source": "arxiv",
  "message": "正在处理ArXiv论文...",
  "articles_processed": 15,
  "total_articles": 25
}
```

### 报告管理

#### 获取结构化新闻数据

**端点:** `GET /api/news/structured`

**查询参数:**
- `date` (string): 日期，格式 YYYY-MM-DD

**成功响应 (200 OK):**
```json
{
  "date": "2024-01-15",
  "total_articles": 25,
  "articles": [
    {
      "title": "OpenAI发布GPT-4新版本",
      "summary": "OpenAI今日发布了GPT-4的最新版本...",
      "category": "tech_breakthrough",
      "importance": "high",
      "key_points": ["性能提升20%", "支持更长的上下文"],
      "tags": ["GPT-4", "OpenAI", "AI"]
    }
  ]
}
```

## ❌ 错误处理

### 标准错误响应格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "用户友好的错误描述"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 常见错误代码

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | VALIDATION_ERROR | 请求参数验证失败 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 429 | RATE_LIMIT_EXCEEDED | 请求频率超限 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 📝 SDK和示例

### Python SDK示例

```python
import requests

class AINewsClient:
    def __init__(self, base_url, api_key=None):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def get_news(self, page=1, category=None):
        params = {'page': page}
        if category:
            params['category'] = category
        
        response = requests.get(
            f'{self.base_url}/news/',
            headers=self.headers,
            params=params
        )
        return response.json()
    
    def send_chat_message(self, message):
        data = {'message': message}
        response = requests.post(
            f'{self.base_url}/chat/send/',
            headers=self.headers,
            json=data
        )
        return response.json()

# 使用示例
client = AINewsClient('http://localhost:8000/api', 'your_token')
news = client.get_news(category='tech_breakthrough')
chat_response = client.send_chat_message('分析今天的新闻')
```

### JavaScript SDK示例

```javascript
class AINewsAPI {
  constructor(baseURL, token = null) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  }

  async getNews(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/news/?${query}`);
  }

  async sendChatMessage(message) {
    return this.request('/chat/send/', {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  }
}

// 使用示例
const api = new AINewsAPI('http://localhost:8000/api', 'your_token');
const news = await api.getNews({ category: 'tech_breakthrough' });
const chatResponse = await api.sendChatMessage('分析今天的新闻');
```

---

更多详细信息和最新更新请访问在线API文档：`http://localhost:8000/api/schema/swagger-ui/`