# 部署指南

本文档详细介绍了AI Daily News平台的部署方法，包括开发环境、测试环境和生产环境的部署配置。

## 📋 目录

- [环境要求](#环境要求)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker部署](#docker部署)
- [环境配置](#环境配置)
- [数据库配置](#数据库配置)
- [Web服务器配置](#web服务器配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🔧 环境要求

### 系统要求

- **操作系统**: Linux (推荐 Ubuntu 20.04+), macOS, Windows
- **CPU**: 2核心以上
- **内存**: 4GB以上 (推荐8GB)
- **存储**: 20GB以上可用空间
- **网络**: 稳定的互联网连接 (用于RSS抓取和AI API调用)

### 软件依赖

- **Python**: 3.8+ (推荐3.10)
- **Node.js**: 16+ (推荐18.x LTS)
- **npm**: 8+
- **Git**: 2.0+
- **数据库**: SQLite (默认) 或 PostgreSQL 12+

### 可选组件

- **Docker**: 20.x+ (用于容器化部署)
- **Docker Compose**: 2.x+
- **Nginx**: 1.18+ (生产环境Web服务器)
- **Redis**: 6.x+ (缓存和任务队列)

## 🚀 开发环境部署

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

### 2. 后端开发环境

```bash
# 进入后端目录
cd backend

# 创建Python虚拟环境
python3 -m venv venv

# 激活虚拟环境
# Linux/macOS:
source venv/bin/activate
# Windows:
# venv\Scripts\activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

### 3. AI代理开发环境

```bash
# 打开新终端，进入AI代理目录
cd ai-news-agent

# 创建Python虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows

# 安装依赖
pip install -r requirements.txt

# 设置API密钥
export SILICONFLOW_API_KEY="your_api_key_here"

# 启动AI代理服务
python api_server.py
```

### 4. 前端开发环境

```bash
# 打开新终端，进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 5. 验证部署

访问以下地址验证服务是否正常运行：

- 前端应用: http://localhost:3000
- 后端API: http://localhost:8000/api/
- Django管理后台: http://localhost:8000/admin/
- AI代理API: http://localhost:5001/api/health

## 🏗️ 生产环境部署

### 1. 服务器准备

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装基础依赖
sudo apt install -y python3 python3-pip python3-venv nodejs npm git nginx postgresql postgresql-contrib

# 创建应用用户
sudo useradd -m -s /bin/bash ainews
sudo usermod -aG sudo ainews

# 切换到应用用户
sudo su - ainews
```

### 2. 数据库设置 (PostgreSQL)

```bash
# 切换到postgres用户
sudo su - postgres

# 创建数据库和用户
psql << EOF
CREATE DATABASE ai_daily_news;
CREATE USER ainews_user WITH PASSWORD 'your_secure_password';
ALTER ROLE ainews_user SET client_encoding TO 'utf8';
ALTER ROLE ainews_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ainews_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ai_daily_news TO ainews_user;
\q
EOF

# 退出postgres用户
exit
```

### 3. 应用部署

```bash
# 克隆项目到生产目录
sudo mkdir -p /opt/ai_daily_news
sudo chown ainews:ainews /opt/ai_daily_news
cd /opt/ai_daily_news
git clone https://github.com/your-username/ai_daily_news.git .

# 后端部署
cd backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# 配置生产环境变量
cat > .env << EOF
SECRET_KEY=your_very_secret_key_here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,localhost
DATABASE_URL=postgresql://ainews_user:your_secure_password@localhost/ai_daily_news
STATIC_URL=/static/
STATIC_ROOT=/opt/ai_daily_news/static/
MEDIA_URL=/media/
MEDIA_ROOT=/opt/ai_daily_news/media/
EOF

# 数据库迁移
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser

# AI代理部署
cd ../ai-news-agent
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 配置AI代理环境
cat > .env << EOF
SILICONFLOW_API_KEY=your_api_key_here
HOST=0.0.0.0
PORT=5001
DEBUG=False
EOF

# 前端构建
cd ../frontend
npm install
npm run build
```

### 4. Systemd服务配置

创建后端服务文件：

```bash
sudo tee /etc/systemd/system/ai-news-backend.service << EOF
[Unit]
Description=AI Daily News Backend
After=network.target postgresql.service

[Service]
Type=exec
User=ainews
WorkingDirectory=/opt/ai_daily_news/backend
Environment=PATH=/opt/ai_daily_news/backend/venv/bin
EnvironmentFile=/opt/ai_daily_news/backend/.env
ExecStart=/opt/ai_daily_news/backend/venv/bin/gunicorn ai_news_backend.wsgi:application --bind 127.0.0.1:8000 --workers 3
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

创建AI代理服务文件：

```bash
sudo tee /etc/systemd/system/ai-news-agent.service << EOF
[Unit]
Description=AI Daily News Agent
After=network.target

[Service]
Type=exec
User=ainews
WorkingDirectory=/opt/ai_daily_news/ai-news-agent
Environment=PATH=/opt/ai_daily_news/ai-news-agent/venv/bin
EnvironmentFile=/opt/ai_daily_news/ai-news-agent/.env
ExecStart=/opt/ai_daily_news/ai-news-agent/venv/bin/python api_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

启动服务：

```bash
# 重新加载systemd配置
sudo systemctl daemon-reload

# 启动并启用服务
sudo systemctl enable ai-news-backend ai-news-agent
sudo systemctl start ai-news-backend ai-news-agent

# 检查服务状态
sudo systemctl status ai-news-backend ai-news-agent
```

### 5. Nginx配置

```bash
sudo tee /etc/nginx/sites-available/ai-daily-news << EOF
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL配置 (需要配置SSL证书)
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 前端静态文件
    location / {
        root /opt/ai_daily_news/frontend/build;
        index index.html;
        try_files \$uri \$uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 后端API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Django静态文件
    location /static/ {
        root /opt/ai_daily_news;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Django媒体文件
    location /media/ {
        root /opt/ai_daily_news;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # AI代理API
    location /ai-api/ {
        rewrite ^/ai-api/(.*) /\$1 break;
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;
}
EOF

# 启用网站配置
sudo ln -s /etc/nginx/sites-available/ai-daily-news /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🐳 Docker部署

### 1. Docker Compose配置

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: ai_daily_news
      POSTGRES_USER: ainews_user
      POSTGRES_PASSWORD: your_secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    restart: unless-stopped
    
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://ainews_user:your_secure_password@db:5432/ai_daily_news
      - REDIS_URL=redis://redis:6379/0
    volumes:
      - static_volume:/app/static
      - media_volume:/app/media
    depends_on:
      - db
      - redis
    restart: unless-stopped
    
  ai-agent:
    build:
      context: ./ai-news-agent
      dockerfile: Dockerfile
    environment:
      - SILICONFLOW_API_KEY=your_api_key_here
      - HOST=0.0.0.0
      - PORT=5001
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/static
      - media_volume:/media
      - ./ssl:/etc/nginx/ssl  # SSL证书目录
    depends_on:
      - backend
      - frontend
      - ai-agent
    restart: unless-stopped

volumes:
  postgres_data:
  static_volume:
  media_volume:
```

### 2. 创建Dockerfile

**后端Dockerfile** (`backend/Dockerfile`):

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn psycopg2-binary

# 复制应用代码
COPY . .

# 创建静态文件目录
RUN mkdir -p /app/static /app/media

# 收集静态文件
RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "ai_news_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

**AI代理Dockerfile** (`ai-news-agent/Dockerfile`):

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建输出目录
RUN mkdir -p /app/output

EXPOSE 5001

CMD ["python", "api_server.py"]
```

**前端Dockerfile** (`frontend/Dockerfile`):

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/build /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. 启动Docker部署

```bash
# 构建并启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入后端容器执行数据库迁移
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

## ⚙️ 环境配置

### 开发环境配置

创建 `backend/.env.development`:

```env
SECRET_KEY=dev-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### 生产环境配置

创建 `backend/.env.production`:

```env
SECRET_KEY=your-very-long-and-secure-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
DATABASE_URL=postgresql://user:password@localhost/ai_daily_news
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 邮件配置
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 安全设置
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### AI代理配置

创建 `ai-news-agent/.env`:

```env
# API配置
SILICONFLOW_API_KEY=your_api_key_here
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# 服务配置
HOST=0.0.0.0
PORT=5001
DEBUG=False

# 抓取配置
MAX_ARTICLES_PER_SOURCE=20
REQUEST_TIMEOUT=30
MAX_RETRIES=3

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/ai_agent.log
```

## 🗄️ 数据库配置

### PostgreSQL配置

```bash
# 安装PostgreSQL
sudo apt install postgresql postgresql-contrib

# 配置PostgreSQL
sudo -u postgres psql << EOF
-- 创建数据库
CREATE DATABASE ai_daily_news;

-- 创建用户
CREATE USER ainews_user WITH PASSWORD 'secure_password';

-- 设置用户权限
ALTER ROLE ainews_user SET client_encoding TO 'utf8';
ALTER ROLE ainews_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ainews_user SET timezone TO 'UTC';

-- 授权
GRANT ALL PRIVILEGES ON DATABASE ai_daily_news TO ainews_user;

-- 退出
\q
EOF

# 配置PostgreSQL认证
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
sudo systemctl restart postgresql
```

### 数据库优化

在 `backend/settings.py` 中添加数据库优化配置：

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ai_daily_news',
        'USER': 'ainews_user',
        'PASSWORD': 'secure_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'MAX_CONNS': 20,
            'MIN_CONNS': 5,
        },
        'CONN_MAX_AGE': 600,
    }
}
```

## 🌐 Web服务器配置

### Nginx性能优化

```nginx
# /etc/nginx/nginx.conf

user www-data;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # 基本设置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    
    # MIME类型
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    # 访问日志
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;
    
    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/rss+xml
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/svg+xml
        image/x-icon
        text/css
        text/plain
        text/x-component;
    
    # 包含站点配置
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### SSL证书配置

使用Let's Encrypt获取免费SSL证书：

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### 应用监控

创建监控脚本 `scripts/monitor.sh`:

```bash
#!/bin/bash

# 检查服务状态
check_service() {
    local service=$1
    if systemctl is-active --quiet $service; then
        echo "✅ $service is running"
    else
        echo "❌ $service is down"
        # 可以添加重启逻辑或发送告警
    fi
}

# 检查端口
check_port() {
    local port=$1
    local service=$2
    if nc -z localhost $port; then
        echo "✅ $service (port $port) is accessible"
    else
        echo "❌ $service (port $port) is not accessible"
    fi
}

echo "=== 服务状态检查 ==="
check_service ai-news-backend
check_service ai-news-agent
check_service nginx
check_service postgresql

echo "=== 端口检查 ==="
check_port 8000 "Backend API"
check_port 5001 "AI Agent API"
check_port 80 "HTTP"
check_port 443 "HTTPS"

echo "=== 磁盘空间检查 ==="
df -h /

echo "=== 内存使用检查 ==="
free -h

echo "=== 系统负载检查 ==="
uptime
```

### 日志配置

在 `backend/settings.py` 中配置日志：

```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/ai_daily_news/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 日志轮转

配置logrotate：

```bash
sudo tee /etc/logrotate.d/ai-daily-news << EOF
/var/log/ai_daily_news/*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 644 ainews ainews
    postrotate
        systemctl reload ai-news-backend
        systemctl reload ai-news-agent
    endscript
}
EOF
```

## 🔧 故障排除

### 常见问题

**1. 数据库连接失败**

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查数据库连接
sudo -u postgres psql -c "SELECT version();"

# 测试Django数据库连接
cd /opt/ai_daily_news/backend
source venv/bin/activate
python manage.py dbshell
```

**2. AI代理API调用失败**

```bash
# 检查API密钥
echo $SILICONFLOW_API_KEY

# 测试API连接
curl -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
     https://api.siliconflow.cn/v1/models

# 检查AI代理日志
journalctl -u ai-news-agent -f
```

**3. 前端静态文件404**

```bash
# 重新收集静态文件
cd /opt/ai_daily_news/backend
source venv/bin/activate
python manage.py collectstatic --noinput

# 检查nginx配置
sudo nginx -t
sudo systemctl reload nginx
```

**4. 内存不足**

```bash
# 检查内存使用
free -h
ps aux --sort=-%mem | head

# 添加swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 性能优化

**1. 数据库优化**

```sql
-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM news_newsitem ORDER BY timestamp DESC LIMIT 20;

-- 创建索引
CREATE INDEX CONCURRENTLY idx_news_timestamp ON news_newsitem(timestamp);
CREATE INDEX CONCURRENTLY idx_news_category ON news_newsitem(category);
```

**2. 缓存配置**

在 `backend/settings.py` 中添加Redis缓存：

```python
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": "redis://127.0.0.1:6379/1",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
        }
    }
}

# 会话缓存
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"
```

**3. 前端优化**

```bash
# 分析打包大小
cd frontend
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# 启用浏览器缓存
# 在nginx配置中添加缓存头
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 备份策略

**1. 数据库备份**

```bash
# 创建备份脚本
cat > /opt/ai_daily_news/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/ai_daily_news/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ai_daily_news"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
pg_dump -h localhost -U ainews_user $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
EOF

chmod +x /opt/ai_daily_news/scripts/backup.sh

# 设置定时备份
crontab -e
# 添加：0 2 * * * /opt/ai_daily_news/scripts/backup.sh
```

**2. 应用备份**

```bash
# 备份应用文件
tar -czf /backup/ai_daily_news_$(date +%Y%m%d).tar.gz \
    --exclude='*/venv/*' \
    --exclude='*/node_modules/*' \
    --exclude='*/.git/*' \
    /opt/ai_daily_news
```

---

这份部署指南涵盖了从开发环境到生产环境的完整部署流程。根据实际需求选择合适的部署方式，并做好监控和备份工作。

如有问题，请参考[故障排除文档](troubleshooting.md)或联系技术支持。
