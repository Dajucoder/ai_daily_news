# API文档

AI Daily News 平台提供完整的RESTful API接口，包括后端Django API和AI代理API。

## 📋 目录

- [认证接口](#认证接口)
- [新闻接口](#新闻接口)
- [AI代理接口](#ai代理接口)
- [数据模型](#数据模型)
- [错误处理](#错误处理)
- [请求示例](#请求示例)

## 🔐 认证接口

**基础URL**: `http://localhost:8000/api/accounts/`

### 用户注册

**POST** `/register/`

注册新用户账户。

**请求体**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "password2": "string"
}
```

**响应**
```json
{
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  },
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

### 用户登录

**POST** `/login/`

用户登录获取访问令牌。

**请求体**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应**
```json
{
  "tokens": {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  },
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

### 刷新令牌

**POST** `/refresh/`

使用刷新令牌获取新的访问令牌。

**请求体**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 用户登出

**POST** `/logout/`

注销用户并拉黑刷新令牌。

**请求头**
```
Authorization: Bearer <access_token>
```

**请求体**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**响应**
```json
{
  "detail": "Successfully logged out"
}
```

## 📰 新闻接口

**基础URL**: `http://localhost:8000/api/news/`

### 获取新闻列表

**GET** `/`

获取新闻列表，支持分页和筛选。

**查询参数**
- `page` (int): 页码，默认为1
- `page_size` (int): 每页数量，默认为20，最大100
- `category` (string): 新闻分类筛选
- `importance` (string): 重要程度筛选 (high/medium/low)
- `search` (string): 搜索关键词
- `date_from` (date): 开始日期 (YYYY-MM-DD)
- `date_to` (date): 结束日期 (YYYY-MM-DD)
- `ordering` (string): 排序字段，可选：-timestamp, -created_at, title

**示例请求**
```
GET /api/news/?page=1&page_size=10&category=tech_breakthrough&importance=high
```

**响应**
```json
{
  "count": 150,
  "next": "http://localhost:8000/api/news/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "GPT-4发布重大更新",
      "source": "OpenAI博客",
      "content": "详细内容...",
      "summary": "AI摘要...",
      "url": "https://openai.com/blog/...",
      "category": "tech_breakthrough",
      "importance": "high",
      "key_points": ["关键点1", "关键点2"],
      "timestamp": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### 获取新闻详情

**GET** `/{id}/`

获取指定ID的新闻详情。

**响应**
```json
{
  "id": 1,
  "title": "GPT-4发布重大更新",
  "source": "OpenAI博客",
  "content": "详细内容...",
  "summary": "AI摘要...",
  "url": "https://openai.com/blog/...",
  "category": "tech_breakthrough",
  "importance": "high",
  "key_points": ["关键点1", "关键点2"],
  "timestamp": "2024-01-15T10:30:00Z",
  "created_at": "2024-01-15T10:35:00Z",
  "updated_at": "2024-01-15T10:35:00Z"
}
```

### 触发新闻抓取

**POST** `/fetch/`

手动触发新闻抓取任务。

**请求头**
```
Authorization: Bearer <access_token>
```

**请求体** (可选)
```json
{
  "date": "2024-01-15",
  "force_refresh": false
}
```

**响应**
```json
{
  "message": "新闻抓取任务已启动",
  "task_id": "fetch_news_20240115",
  "status": "started"
}
```

### 获取新闻分类

**GET** `/categories/`

获取所有可用的新闻分类列表。

**响应**
```json
{
  "categories": [
    {
      "value": "tech_breakthrough",
      "label": "技术突破",
      "description": "重大技术突破和创新"
    },
    {
      "value": "product_release",
      "label": "产品发布",
      "description": "新产品和服务发布"
    }
  ]
}
```

### 获取新闻统计

**GET** `/analytics/`

获取新闻统计和分析数据。

**查询参数**
- `days` (int): 统计天数，默认为7天

**响应**
```json
{
  "total_news": 1250,
  "today_news": 45,
  "categories_distribution": {
    "tech_breakthrough": 25,
    "product_release": 15,
    "industry_news": 30
  },
  "importance_distribution": {
    "high": 20,
    "medium": 35,
    "low": 15
  },
  "daily_counts": [
    {"date": "2024-01-15", "count": 45},
    {"date": "2024-01-14", "count": 38}
  ],
  "top_sources": [
    {"source": "Hugging Face博客", "count": 12},
    {"source": "OpenAI博客", "count": 8}
  ]
}
```

## 🤖 AI代理接口

**基础URL**: `http://localhost:5001/api/`

### 健康检查

**GET** `/health`

检查AI代理服务状态。

**响应**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "ai_processor": "running",
    "rss_fetcher": "running"
  }
}
```

### 获取RSS源列表

**GET** `/sources`

获取配置的RSS数据源列表。

**响应**
```json
{
  "sources": [
    {
      "name": "Hugging Face博客",
      "url": "https://huggingface.co/blog/feed.xml",
      "description": "Hugging Face官方博客，包含最新的AI模型和技术发布",
      "status": "active"
    },
    {
      "name": "OpenAI博客",
      "url": "https://openai.com/blog/rss.xml",
      "description": "OpenAI官方博客",
      "status": "active"
    }
  ]
}
```

### 开始抓取新闻

**POST** `/fetch-news`

启动新闻抓取任务。

**请求体** (可选)
```json
{
  "date": "2024-01-15",
  "force_refresh": false
}
```

**响应**
```json
{
  "message": "新闻抓取任务已启动",
  "task_id": "fetch_20240115_123456",
  "estimated_time": "5-10分钟",
  "sources_count": 5
}
```

### 获取抓取状态

**GET** `/fetch-status`

获取当前抓取任务状态。

**响应**
```json
{
  "status": "running",
  "progress": {
    "current_source": 2,
    "total_sources": 5,
    "articles_processed": 25,
    "articles_saved": 18
  },
  "start_time": "2024-01-15T10:30:00Z",
  "estimated_completion": "2024-01-15T10:40:00Z"
}
```

### 获取最新报告

**GET** `/reports/latest`

获取最新的新闻抓取报告。

**响应**
```json
{
  "report_date": "2024-01-15",
  "total_articles": 45,
  "sources_processed": 5,
  "categories": {
    "tech_breakthrough": 12,
    "product_release": 8,
    "industry_news": 15,
    "research_progress": 6,
    "other": 4
  },
  "importance": {
    "high": 8,
    "medium": 22,
    "low": 15
  },
  "processing_time": "8分32秒",
  "success_rate": "96%"
}
```

### 获取指定日期报告

**GET** `/reports/{date}`

获取指定日期的新闻抓取报告。

**路径参数**
- `date`: 日期格式 YYYY-MM-DD

**响应**
```json
{
  "report_date": "2024-01-15",
  "total_articles": 45,
  "articles": [
    {
      "title": "新闻标题",
      "source": "来源名称",
      "category": "tech_breakthrough",
      "importance": "high",
      "summary": "AI生成摘要",
      "url": "原文链接"
    }
  ]
}
```

## 📊 数据模型

### NewsItem (新闻条目)

```typescript
interface NewsItem {
  id: number;
  title: string;               // 新闻标题
  source: string;              // 新闻来源
  content: string;             // 原始内容
  summary: string;             // AI生成摘要
  url?: string;                // 原文链接
  category: Category;          // 新闻分类
  importance: Importance;      // 重要程度
  key_points: string[];        // 关键点列表
  timestamp: string;           // 新闻时间
  created_at: string;          // 创建时间
  updated_at: string;          // 更新时间
}
```

### Category (新闻分类)

```typescript
type Category = 
  | 'tech_breakthrough'    // 技术突破
  | 'product_release'      // 产品发布
  | 'industry_news'        // 行业动态
  | 'policy_regulation'    // 政策法规
  | 'research_progress'    // 研究进展
  | 'application_case'     // 应用案例
  | 'other';               // 其他
```

### Importance (重要程度)

```typescript
type Importance = 'high' | 'medium' | 'low';
```

### User (用户)

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  date_joined: string;
  last_login?: string;
}
```

## ❌ 错误处理

API使用标准HTTP状态码和错误响应格式。

### 错误响应格式

```json
{
  "error": {
    "code": "error_code",
    "message": "错误描述",
    "details": {
      "field": ["具体错误信息"]
    }
  }
}
```

### 常见状态码

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | 成功 | 请求成功处理 |
| 201 | 创建成功 | 资源创建成功 |
| 400 | 请求错误 | 参数验证失败 |
| 401 | 未授权 | Token无效或过期 |
| 403 | 禁止访问 | 权限不足 |
| 404 | 未找到 | 资源不存在 |
| 500 | 服务器错误 | 内部服务器错误 |

### 常见错误示例

**401 未授权**
```json
{
  "error": {
    "code": "token_invalid",
    "message": "访问令牌无效或已过期"
  }
}
```

**400 参数错误**
```json
{
  "error": {
    "code": "validation_error",
    "message": "请求参数验证失败",
    "details": {
      "email": ["请输入有效的邮箱地址"],
      "password": ["密码长度至少8位"]
    }
  }
}
```

**404 资源未找到**
```json
{
  "error": {
    "code": "not_found",
    "message": "请求的新闻不存在"
  }
}
```

## 📝 请求示例

### 使用cURL

**获取新闻列表**
```bash
curl -X GET "http://localhost:8000/api/news/?page=1&category=tech_breakthrough" \
  -H "Authorization: Bearer your_access_token"
```

**用户登录**
```bash
curl -X POST "http://localhost:8000/api/accounts/login/" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**触发新闻抓取**
```bash
curl -X POST "http://localhost:5001/api/fetch-news" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "force_refresh": false
  }'
```

### 使用JavaScript (Axios)

```javascript
// 获取新闻列表
const getNews = async () => {
  try {
    const response = await axios.get('/api/news/', {
      params: {
        page: 1,
        category: 'tech_breakthrough',
        importance: 'high'
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('获取新闻失败:', error.response.data);
  }
};

// 用户登录
const login = async (username, password) => {
  try {
    const response = await axios.post('/api/accounts/login/', {
      username,
      password
    });
    const { tokens, user } = response.data;
    // 保存token和用户信息
    localStorage.setItem('accessToken', tokens.access);
    localStorage.setItem('refreshToken', tokens.refresh);
    return { tokens, user };
  } catch (error) {
    console.error('登录失败:', error.response.data);
  }
};
```

### 使用Python (requests)

```python
import requests

# 基础配置
BASE_URL = "http://localhost:8000/api"
AI_AGENT_URL = "http://localhost:5001/api"

# 获取新闻列表
def get_news(access_token, page=1, category=None):
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'page': page}
    if category:
        params['category'] = category
    
    response = requests.get(f"{BASE_URL}/news/", 
                          headers=headers, 
                          params=params)
    return response.json()

# 用户登录
def login(username, password):
    data = {
        'username': username,
        'password': password
    }
    response = requests.post(f"{BASE_URL}/accounts/login/", json=data)
    return response.json()

# 触发新闻抓取
def fetch_news(date=None):
    data = {}
    if date:
        data['date'] = date
    
    response = requests.post(f"{AI_AGENT_URL}/fetch-news", json=data)
    return response.json()
```

## 🔧 API配置

### 分页设置

- 默认页面大小：20条
- 最大页面大小：100条
- 分页参数：`page` 和 `page_size`

### 请求限制

- API请求频率限制：每分钟100次请求
- 上传文件大小限制：10MB
- 请求超时时间：30秒

### 认证要求

- 所有需要认证的接口都需要在请求头中包含有效的JWT Token
- Token格式：`Authorization: Bearer <access_token>`
- Token有效期：24小时
- 刷新Token有效期：7天

---

**注意**: 本文档基于当前API实现，如有更新请参考最新版本。如遇问题请查看[故障排除文档](troubleshooting.md)或提交[Issue](https://github.com/your-username/ai_daily_news/issues)。
