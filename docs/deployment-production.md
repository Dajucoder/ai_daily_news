# 生产环境部署指南

本文档详细介绍如何在生产环境中部署 AI Daily News 系统。

## 📋 目录

- [部署架构](#部署架构)
- [环境准备](#环境准备)
- [Docker部署](#docker部署)
- [Kubernetes部署](#kubernetes部署)
- [监控配置](#监控配置)
- [安全配置](#安全配置)
- [备份策略](#备份策略)

## 🏗️ 部署架构

### 推荐架构

```
Internet
    ↓
Load Balancer (Nginx/HAProxy)
    ↓
┌─────────────────────────────────────┐
│            Docker Swarm             │
│  ┌─────────┐  ┌─────────┐  ┌──────┐ │
│  │Frontend │  │Backend  │  │Agent │ │
│  │(Nginx)  │  │(Django) │  │(Flask)│ │
│  └─────────┘  └─────────┘  └──────┘ │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│         Database Layer              │
│  ┌─────────────┐  ┌───────────────┐ │
│  │PostgreSQL   │  │Redis Cache    │ │
│  │(Primary)    │  │               │ │
│  └─────────────┘  └───────────────┘ │
└─────────────────────────────────────┘
```

## 🛠️ 环境准备

### 系统要求

**最低配置:**
- CPU: 2核心
- 内存: 4GB RAM
- 存储: 50GB SSD
- 操作系统: Ubuntu 20.04+ / CentOS 8+

**推荐配置:**
- CPU: 4核心
- 内存: 8GB RAM
- 存储: 100GB SSD
- 操作系统: Ubuntu 22.04 LTS

### 软件依赖

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
sudo apt install -y git nginx certbot python3-certbot-nginx
```

## 🐳 Docker部署

### 1. 项目部署

```bash
# 克隆项目
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news

# 创建生产环境配置
cp .env.example .env.production
```

### 2. 环境变量配置

编辑 `.env.production` 文件：

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

# Redis配置
REDIS_URL=redis://redis:6379/0

# AI服务配置
SILICONFLOW_API_KEY=your-production-api-key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# 邮件配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 安全配置
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
```

### 3. 生产环境Docker Compose

创建 `docker-compose.prod.yml`：

```yaml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - app-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    env_file:
      - .env.production
    depends_on:
      - db
      - redis
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    restart: unless-stopped
    networks:
      - app-network

  agent:
    build:
      context: ./ai-news-agent
      dockerfile: Dockerfile.prod
    env_file:
      - .env.production
    restart: unless-stopped
    networks:
      - app-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        REACT_APP_API_BASE_URL: https://your-domain.com/api
        REACT_APP_AGENT_BASE_URL: https://your-domain.com/agent/api
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - agent
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
      - ./nginx/prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  static_volume:
  media_volume:

networks:
  app-network:
    driver: bridge
```

### 4. 生产环境Dockerfile

**后端Dockerfile.prod:**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 收集静态文件
RUN python manage.py collectstatic --noinput

# 创建非root用户
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "ai_news_backend.wsgi:application"]
```

**前端Dockerfile.prod:**
```dockerfile
# 构建阶段
FROM node:16-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
ARG REACT_APP_API_BASE_URL
ARG REACT_APP_AGENT_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
ENV REACT_APP_AGENT_BASE_URL=$REACT_APP_AGENT_BASE_URL

RUN npm run build

# 生产阶段
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/prod.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### 5. Nginx配置

创建 `nginx/prod.conf`：

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # 日志格式
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log;

    # 基础配置
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 上游服务器
    upstream backend {
        server backend:8000;
    }

    upstream agent {
        server agent:5001;
    }

    # HTTP重定向到HTTPS
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS服务器
    server {
        listen 443 ssl http2;
        server_name your-domain.com www.your-domain.com;

        # SSL配置
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # 安全头
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # 静态文件
        location /static/ {
            alias /app/staticfiles/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        location /media/ {
            alias /app/media/;
            expires 1y;
            add_header Cache-Control "public";
        }

        # API代理
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /agent/api/ {
            proxy_pass http://agent/api/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # 前端应用
        location / {
            root /usr/share/nginx/html;
            index index.html index.htm;
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 6. SSL证书配置

```bash
# 使用Let's Encrypt获取免费SSL证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. 启动生产环境

```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 创建超级用户
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

## ☸️ Kubernetes部署

### 1. 命名空间

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: ai-news
```

### 2. 配置映射

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ai-news-config
  namespace: ai-news
data:
  DEBUG: "False"
  ALLOWED_HOSTS: "your-domain.com,www.your-domain.com"
  DATABASE_URL: "postgresql://ai_news_user:password@postgres:5432/ai_news_db"
```

### 3. 密钥

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: ai-news-secrets
  namespace: ai-news
type: Opaque
data:
  SECRET_KEY: <base64-encoded-secret-key>
  SILICONFLOW_API_KEY: <base64-encoded-api-key>
  POSTGRES_PASSWORD: <base64-encoded-password>
```

### 4. 数据库部署

```yaml
# postgres.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: ai-news
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        env:
        - name: POSTGRES_DB
          value: ai_news_db
        - name: POSTGRES_USER
          value: ai_news_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: ai-news-secrets
              key: POSTGRES_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: ai-news
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

## 📊 监控配置

### 1. Prometheus配置

```yaml
# prometheus.yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ai-news-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'

  - job_name: 'ai-news-agent'
    static_configs:
      - targets: ['agent:5001']
    metrics_path: '/metrics'

  - job_name: 'nginx'
    static_configs:
      - targets: ['frontend:9113']
```

### 2. Grafana仪表板

创建监控仪表板监控以下指标：
- 应用响应时间
- 错误率
- 数据库连接数
- 内存和CPU使用率
- 新闻抓取成功率

## 🔒 安全配置

### 1. 防火墙配置

```bash
# 配置UFW防火墙
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 5432/tcp  # 禁止外部访问数据库
```

### 2. 安全加固

```bash
# 禁用root登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 配置fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. 数据库安全

```sql
-- 创建只读用户
CREATE USER ai_news_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE ai_news_db TO ai_news_readonly;
GRANT USAGE ON SCHEMA public TO ai_news_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO ai_news_readonly;
```

## 💾 备份策略

### 1. 数据库备份

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="ai_news_db"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker-compose exec -T db pg_dump -U ai_news_user $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 压缩备份
gzip $BACKUP_DIR/db_backup_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql.gz"
```

### 2. 媒体文件备份

```bash
#!/bin/bash
# media_backup.sh

MEDIA_DIR="/path/to/media"
BACKUP_DIR="/backups/media"
DATE=$(date +%Y%m%d)

# 同步媒体文件
rsync -av --delete $MEDIA_DIR/ $BACKUP_DIR/media_$DATE/

echo "Media backup completed: media_$DATE"
```

### 3. 自动备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份数据库
0 2 * * * /path/to/backup.sh

# 每周日凌晨3点备份媒体文件
0 3 * * 0 /path/to/media_backup.sh
```

## 🚀 部署检查清单

### 部署前检查

- [ ] 环境变量配置完成
- [ ] SSL证书配置完成
- [ ] 数据库连接测试通过
- [ ] AI API密钥配置正确
- [ ] 防火墙规则配置完成

### 部署后检查

- [ ] 所有服务正常启动
- [ ] 网站可以正常访问
- [ ] API接口响应正常
- [ ] 数据库连接正常
- [ ] 日志记录正常
- [ ] 监控系统正常
- [ ] 备份脚本测试通过

---

按照本指南进行部署，可以确保 AI Daily News 系统在生产环境中稳定运行。如有问题，请参考故障排除文档或联系技术支持。