# 部署指南

本文档提供 AI Daily News 智能新闻系统的完整部署指南，涵盖开发环境和生产环境的部署方案。

## 📋 目录

- [部署概述](#部署概述)
- [环境要求](#环境要求)
- [快速部署](#快速部署)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 🌐 部署概述

AI Daily News 系统采用微服务架构，包含以下核心组件：

### 系统架构
```
┌─────────────────────────────────────────┐
│                 用户层                   │
│            Web浏览器/移动端              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│              负载均衡层                  │
│              Nginx/HAProxy              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│               应用层                     │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │Frontend │ │Backend  │ │AI Agent   │  │
│  │(React)  │ │(Django) │ │(Flask)    │  │
│  └─────────┘ └─────────┘ └───────────┘  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────┴───────────────────────┐
│               数据层                     │
│  ┌─────────────┐ ┌─────────────────────┐ │
│  │PostgreSQL   │ │Redis Cache          │ │
│  └─────────────┘ └─────────────────────┘ │
└─────────────────────────────────────────┘
```

### 服务组件
- **Frontend**: React 18 + TypeScript + Ant Design
- **Backend**: Django 5.2 + Django REST Framework
- **AI Agent**: Flask + SiliconFlow API
- **Database**: PostgreSQL 15 (生产) / SQLite (开发)
- **Cache**: Redis 7
- **Proxy**: Nginx

## 💻 环境要求

### 最低系统要求
- **操作系统**: Ubuntu 20.04+ / macOS 10.15+ / Windows 10+
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **网络**: 稳定的互联网连接

### 推荐系统配置
- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps+ 带宽

### 软件依赖
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Node.js**: 16+ (本地开发)
- **Python**: 3.8+ (本地开发)

## 🚀 快速部署

### 使用Docker Compose (推荐)

这是最简单的部署方式，适合快速体验和开发环境。

#### 1. 获取项目代码
```bash
# 克隆项目
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

#### 2. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量 (必须配置AI API密钥)
vim .env
```

**最小配置示例:**
```env
# AI服务配置 (必需)
SILICONFLOW_API_KEY=your_api_key_here

# 其他配置使用默认值即可
SECRET_KEY=your-secret-key-here
DEBUG=True
```

#### 3. 启动服务
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

#### 4. 访问应用
- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:8000/api/
- **AI代理API**: http://localhost:5001/api/health
- **管理后台**: http://localhost:8000/admin/

#### 5. 创建管理员账户
```bash
# 创建Django超级用户
docker-compose exec backend python manage.py createsuperuser
```

## 🛠️ 开发环境部署

### 本地开发环境

适合需要修改代码的开发者使用。

#### 1. 环境准备
```bash
# 安装Python虚拟环境
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# 或 venv\Scripts\activate  # Windows

# 安装Node.js (使用nvm推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 16
nvm use 16
```

#### 2. 后端开发环境
```bash
cd backend

# 安装Python依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑.env文件，配置必要的环境变量

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver 0.0.0.0:8000
```

#### 3. 前端开发环境
```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑.env.local文件

# 启动开发服务器
npm start
```

#### 4. AI代理开发环境
```bash
cd ai-news-agent

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑.env文件，配置AI API密钥

# 启动服务
python start.py
# 选择选项2启动API服务器
```

### 开发环境Docker配置

使用开发专用的Docker配置，支持代码热重载。

```bash
# 使用开发环境配置
docker-compose -f docker-compose.dev.yml up --build -d

# 查看开发环境日志
docker-compose -f docker-compose.dev.yml logs -f
```

**开发环境特性:**
- 代码热重载
- 详细的调试日志
- 开发工具集成
- 快速重启

## 🏭 生产环境部署

### 生产环境准备

#### 1. 服务器配置
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装其他工具
sudo apt install -y nginx certbot python3-certbot-nginx git
```

#### 2. 项目部署
```bash
# 克隆项目到生产目录
sudo mkdir -p /opt/ai_daily_news
sudo chown $USER:$USER /opt/ai_daily_news
cd /opt/ai_daily_news
git clone https://github.com/your-username/ai_daily_news.git .
```

#### 3. 生产环境配置
```bash
# 创建生产环境配置
cp .env.example .env.production

# 编辑生产环境配置
vim .env.production
```

**生产环境配置示例:**
```env
# Django配置
SECRET_KEY=your-super-secret-production-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 数据库配置
DATABASE_URL=postgresql://ai_news_user:secure_password@db:5432/ai_news_db
POSTGRES_DB=ai_news_db
POSTGRES_USER=ai_news_user
POSTGRES_PASSWORD=secure_password

# AI服务配置
SILICONFLOW_API_KEY=your-production-api-key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# 安全配置
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

#### 4. SSL证书配置
```bash
# 使用Let's Encrypt获取免费SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 5. 启动生产服务
```bash
# 使用生产环境配置启动
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 创建超级用户
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

### 负载均衡配置

对于高流量场景，可以配置多实例负载均衡。

```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  backend:
    deploy:
      replicas: 3
    
  agent:
    deploy:
      replicas: 2
      
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/load-balancer.conf:/etc/nginx/nginx.conf
```

## ⚙️ 配置说明

### 环境变量详解

#### Django后端配置
```env
# 基础配置
SECRET_KEY=django-secret-key                    # Django密钥
DEBUG=False                                     # 调试模式
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain  # 允许的主机

# 数据库配置
DATABASE_URL=postgresql://user:pass@host:port/db  # 数据库连接
POSTGRES_DB=ai_news_db                            # 数据库名
POSTGRES_USER=ai_news_user                        # 数据库用户
POSTGRES_PASSWORD=secure_password                 # 数据库密码

# Redis配置
REDIS_URL=redis://redis:6379/0                   # Redis连接

# AI服务配置
SILICONFLOW_API_KEY=your_api_key                 # AI API密钥
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1  # API基础URL
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct             # 模型名称

# 新闻代理配置
NEWS_AGENT_BASE_URL=http://agent:5001           # 代理服务URL
```

#### 前端配置
```env
# API配置
REACT_APP_API_BASE_URL=http://localhost:8000/api      # 后端API地址
REACT_APP_AGENT_BASE_URL=http://localhost:5001/api    # 代理API地址

# 功能开关
REACT_APP_ENABLE_ANALYTICS=true                       # 启用分析
REACT_APP_ENABLE_NOTIFICATIONS=true                   # 启用通知
```

#### AI代理配置
```env
# AI服务配置
SILICONFLOW_API_KEY=your_api_key                 # AI API密钥
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1  # API基础URL
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct             # 默认模型

# RSS配置
MAX_ARTICLES_PER_SOURCE=10                       # 每个源最大文章数
REQUEST_TIMEOUT=30                               # 请求超时时间
MAX_RETRIES=3                                    # 最大重试次数
```

### Docker配置优化

#### 生产环境Dockerfile优化
```dockerfile
# 后端生产Dockerfile
FROM python:3.9-slim as builder

WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

FROM python:3.9-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

ENV PATH=/root/.local/bin:$PATH
EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "ai_news_backend.wsgi:application"]
```

#### 资源限制配置
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## 🔧 常见问题

### 部署问题

#### 1. 容器启动失败
```bash
# 查看详细错误信息
docker-compose logs [service_name]

# 检查端口占用
sudo netstat -tulpn | grep :8000

# 清理Docker资源
docker system prune -a
```

#### 2. 数据库连接失败
```bash
# 检查数据库容器状态
docker-compose ps db

# 测试数据库连接
docker-compose exec backend python manage.py dbshell

# 重置数据库
docker-compose down
docker volume rm ai_daily_news_postgres_data
docker-compose up -d
```

#### 3. AI API调用失败
```bash
# 检查API密钥配置
docker-compose exec agent printenv | grep SILICONFLOW

# 测试API连接
docker-compose exec backend python test_ai_connection.py
```

### 性能优化

#### 1. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_news_published_at ON news_newsitem(published_at);
CREATE INDEX idx_news_category ON news_newsitem(category);

-- 查询优化
EXPLAIN ANALYZE SELECT * FROM news_newsitem WHERE category = 'tech_breakthrough';
```

#### 2. 缓存配置
```python
# Django缓存配置
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 使用缓存
from django.core.cache import cache
cache.set('news_list', news_data, 300)  # 缓存5分钟
```

#### 3. 前端优化
```typescript
// 代码分割
const NewsList = lazy(() => import('./components/NewsList'));

// 使用memo优化渲染
const NewsItem = React.memo<NewsItemProps>(({ item }) => {
  return <div>{item.title}</div>;
});
```

### 监控和维护

#### 1. 健康检查
```bash
# 检查所有服务状态
curl http://localhost:8000/api/health
curl http://localhost:5001/api/health

# 检查数据库连接
docker-compose exec backend python manage.py check --database default
```

#### 2. 日志管理
```bash
# 查看实时日志
docker-compose logs -f --tail=100

# 日志轮转配置
# 在docker-compose.yml中添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

#### 3. 备份策略
```bash
# 数据库备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T db pg_dump -U ai_news_user ai_news_db > backup_$DATE.sql
gzip backup_$DATE.sql

# 设置定时备份
crontab -e
# 添加: 0 2 * * * /path/to/backup.sh
```

---

按照本指南进行部署，可以快速搭建 AI Daily News 系统。如遇问题，请参考故障排除文档或联系技术支持。