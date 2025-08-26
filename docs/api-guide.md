# API 使用指南

本文档详细介绍 AI Daily News 系统的 API 接口使用方法和最佳实践。

## 📋 目录

- [API概览](#api概览)
- [认证机制](#认证机制)
- [后端API](#后端api)
- [AI代理API](#ai代理api)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 🌐 API概览

### 服务架构

AI Daily News 系统提供两套独立的 API 服务：

- **后端API** (Django REST Framework): 主要业务逻辑和数据管理
- **AI代理API** (Flask): AI新闻处理和分析服务

### 基础URL

```
开发环境:
- 后端API: http://localhost:8000/api/
- AI代理API: http://localhost:5001/api/

生产环境:
- 后端API: https://your-domain.com/api/
- AI代理API: https://your-domain.com/agent/api/
```

## 🔐 认证机制

### JWT Token 认证

系统使用 JWT (JSON Web Token) 进行用户认证。

#### 获取Token

```bash
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your_username",
    "password": "your_password"
  }'
```

**响应示例:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### 使用Token

在请求头中包含 Authorization 字段：

```bash
curl -H "Authorization: Bearer your_access_token" \
  http://localhost:8000/api/news/
```

## 🔧 后端API

### 用户认证相关

#### 用户注册

```http
POST /api/auth/register/
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### 获取用户信息

```http
GET /api/auth/profile/
Authorization: Bearer your_access_token
```

### 新闻管理

#### 获取新闻列表

```http
GET /api/news/
Authorization: Bearer your_access_token
```

**查询参数:**
- `page`: 页码 (默认: 1)
- `category`: 分类过滤
- `search`: 关键词搜索

**响应示例:**
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
      "published_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 聊天功能

#### 发送消息

```http
POST /api/chat/send/
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "message": "请分析一下今天的AI新闻",
  "stream": true
}
```

## 🤖 AI代理API

### 健康检查

```http
GET /api/health
```

### 新闻抓取

#### 开始抓取新闻

```http
POST /api/fetch-news
Content-Type: application/json

{
  "date": "2024-01-15",
  "force_refresh": false
}
```

#### 获取抓取状态

```http
GET /api/fetch-status
```

### 报告管理

#### 获取结构化新闻数据

```http
GET /api/news/structured?date=2024-01-15
```

## ❌ 错误处理

### 标准错误响应格式

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败"
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
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## 📝 最佳实践

### 1. 认证管理

- 定期刷新访问令牌
- 安全存储刷新令牌
- 处理令牌过期情况

### 2. 错误处理

- 实现统一的错误处理机制
- 记录详细的错误日志
- 提供用户友好的错误信息

### 3. 性能优化

- 使用分页查询大量数据
- 实现客户端缓存
- 避免频繁的API调用

### 4. 安全考虑

- 验证所有输入参数
- 使用HTTPS传输敏感数据
- 实现请求频率限制

---

更多详细信息请参考完整的API文档或联系开发团队。