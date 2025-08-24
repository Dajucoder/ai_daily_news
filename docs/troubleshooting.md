# 故障排除指南

本文档提供了AI Daily News平台常见问题的解决方案和调试方法。

## 📋 目录

- [快速诊断](#快速诊断)
- [后端问题](#后端问题)
- [前端问题](#前端问题)
- [AI代理问题](#ai代理问题)
- [数据库问题](#数据库问题)
- [网络问题](#网络问题)
- [性能问题](#性能问题)
- [部署问题](#部署问题)
- [日志分析](#日志分析)

## 🔍 快速诊断

### 系统健康检查

运行以下命令快速检查系统状态：

```bash
# 检查所有服务状态
curl -f http://localhost:8000/api/health/ || echo "❌ 后端服务异常"
curl -f http://localhost:5001/api/health || echo "❌ AI代理服务异常"
curl -f http://localhost:3000/ || echo "❌ 前端服务异常"

# 检查端口占用
netstat -tlnp | grep -E ':(3000|5001|8000)'

# 检查系统资源
free -h
df -h
```

### 服务状态检查

```bash
# 检查Python进程
ps aux | grep python

# 检查Node.js进程
ps aux | grep node

# 检查系统服务（如果使用systemd）
sudo systemctl status ai-news-backend
sudo systemctl status ai-news-agent
```

## 🔧 后端问题

### 1. Django服务无法启动

**错误信息**: `python manage.py runserver` 失败

**可能原因和解决方案**:

**端口占用**
```bash
# 检查端口占用
lsof -i :8000

# 终止占用进程
kill -9 <PID>

# 或使用其他端口
python manage.py runserver 8001
```

**依赖包问题**
```bash
# 检查虚拟环境
which python
which pip

# 重新安装依赖
pip install --upgrade pip
pip install -r requirements.txt

# 检查Django版本
python -c "import django; print(django.VERSION)"
```

**数据库连接问题**
```bash
# 测试数据库连接
python manage.py dbshell

# 如果失败，检查数据库设置
python manage.py check --database default

# 重新进行数据库迁移
python manage.py migrate
```

### 2. 500内部服务器错误

**查看详细错误信息**:

```bash
# 启用调试模式（仅开发环境）
export DEBUG=True

# 查看Django日志
tail -f logs/django.log

# 检查Django错误
python manage.py check
```

**常见解决方案**:

```python
# 在settings.py中添加详细日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
    },
}
```

### 3. API接口404错误

**检查URL配置**:

```bash
# 查看所有URL路由
python manage.py show_urls

# 测试特定API接口
curl -v http://localhost:8000/api/news/
```

**常见问题**:
- URL配置错误
- 应用未正确注册到`INSTALLED_APPS`
- 中间件配置问题

### 4. CORS跨域问题

**错误信息**: `Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy`

**解决方案**:

```python
# 在settings.py中配置CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# 或者允许所有源（仅开发环境）
CORS_ALLOW_ALL_ORIGINS = True
```

### 5. JWT认证问题

**Token过期**:
```bash
# 检查token有效期
python manage.py shell
>>> from rest_framework_simplejwt.tokens import AccessToken
>>> token = AccessToken()
>>> print(token.lifetime)
```

**Token无效**:
```python
# 检查JWT设置
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## 🌐 前端问题

### 1. 前端服务无法启动

**错误信息**: `npm start` 失败

**端口占用**:
```bash
# 检查端口3000占用
lsof -i :3000

# 终止进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm start
```

**依赖问题**:
```bash
# 清除node_modules和package-lock.json
rm -rf node_modules package-lock.json

# 重新安装依赖
npm install

# 或使用yarn
yarn install
```

**内存不足**:
```bash
# 增加Node.js内存限制
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### 2. 编译错误

**TypeScript错误**:
```bash
# 检查TypeScript配置
npx tsc --noEmit

# 查看具体错误
npm start 2>&1 | grep -A 5 -B 5 "error"
```

**ESLint错误**:
```bash
# 运行ESLint检查
npx eslint src/

# 自动修复部分问题
npx eslint src/ --fix
```

**依赖版本冲突**:
```bash
# 检查依赖冲突
npm ls

# 审计安全问题
npm audit
npm audit fix
```

### 3. API请求失败

**网络错误**:
```javascript
// 在浏览器控制台检查
console.log('API Base URL:', process.env.REACT_APP_API_URL);

// 测试API连接
fetch('http://localhost:8000/api/health/')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

**代理配置问题**:
```json
// package.json中的代理配置
{
  "proxy": "http://localhost:8000"
}
```

### 4. 白屏问题

**检查控制台错误**:
```javascript
// 打开浏览器开发者工具，查看Console和Network标签

// 检查静态资源加载
// 查看是否有404错误
```

**路由问题**:
```javascript
// 检查React Router配置
import { BrowserRouter, HashRouter } from 'react-router-dom';

// 生产环境可能需要使用HashRouter
<HashRouter>
  <App />
</HashRouter>
```

## 🤖 AI代理问题

### 1. AI代理服务无法启动

**端口占用**:
```bash
# 检查端口5001占用
lsof -i :5001

# 终止进程
kill -9 <PID>
```

**Python环境问题**:
```bash
# 检查Python版本
python --version

# 检查虚拟环境
which python
which pip

# 重新创建虚拟环境
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. API密钥问题

**错误信息**: `API key not found` 或 `Authentication failed`

**检查API密钥配置**:
```bash
# 检查环境变量
echo $SILICONFLOW_API_KEY

# 检查.env文件
cat ai-news-agent/.env

# 测试API密钥
curl -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
     https://api.siliconflow.cn/v1/models
```

**设置API密钥**:
```bash
# 临时设置
export SILICONFLOW_API_KEY="your_api_key_here"

# 永久设置（添加到.bashrc或.zshrc）
echo 'export SILICONFLOW_API_KEY="your_api_key_here"' >> ~/.bashrc
source ~/.bashrc
```

### 3. RSS抓取失败

**网络连接问题**:
```bash
# 测试RSS源连接
curl -I https://huggingface.co/blog/feed.xml

# 检查DNS解析
nslookup huggingface.co

# 测试网络连通性
ping google.com
```

**RSS解析错误**:
```python
# 在Python中测试RSS解析
import feedparser

# 测试解析特定RSS源
feed = feedparser.parse('https://huggingface.co/blog/feed.xml')
print(f"Feed title: {feed.feed.title}")
print(f"Entries count: {len(feed.entries)}")
```

**超时问题**:
```python
# 增加请求超时时间
REQUEST_TIMEOUT = 60
MAX_RETRIES = 5
```

### 4. AI处理失败

**模型调用错误**:
```python
# 测试AI模型调用
import requests

headers = {
    'Authorization': f'Bearer {SILICONFLOW_API_KEY}',
    'Content-Type': 'application/json'
}

data = {
    'model': 'Qwen/Qwen2.5-7B-Instruct',
    'messages': [{'role': 'user', 'content': 'Hello'}],
    'max_tokens': 100
}

response = requests.post(
    'https://api.siliconflow.cn/v1/chat/completions',
    headers=headers,
    json=data
)

print(response.status_code)
print(response.json())
```

**内容长度问题**:
```python
# 检查内容长度限制
MAX_CONTENT_LENGTH = 8000
MIN_CONTENT_LENGTH = 100

# 分批处理长内容
def split_content(content, max_length=4000):
    return [content[i:i+max_length] for i in range(0, len(content), max_length)]
```

## 🗄️ 数据库问题

### 1. 数据库连接失败

**SQLite权限问题**:
```bash
# 检查数据库文件权限
ls -la db.sqlite3

# 修改权限
chmod 664 db.sqlite3
chown $USER:$USER db.sqlite3
```

**PostgreSQL连接问题**:
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 测试连接
psql -h localhost -U ainews_user -d ai_daily_news

# 检查配置
cat /etc/postgresql/*/main/postgresql.conf | grep listen_addresses
```

### 2. 数据库迁移失败

**迁移冲突**:
```bash
# 查看迁移状态
python manage.py showmigrations

# 重置迁移（谨慎使用）
python manage.py migrate --fake-initial

# 创建新迁移
python manage.py makemigrations
python manage.py migrate
```

**依赖问题**:
```bash
# 手动指定迁移顺序
python manage.py migrate accounts 0001
python manage.py migrate news 0001
```

### 3. 数据丢失或损坏

**备份恢复**:
```bash
# SQLite备份
cp db.sqlite3 db.sqlite3.backup

# PostgreSQL备份
pg_dump -h localhost -U ainews_user ai_daily_news > backup.sql

# 恢复
psql -h localhost -U ainews_user ai_daily_news < backup.sql
```

**数据完整性检查**:
```python
# Django shell中检查数据
python manage.py shell

>>> from news.models import NewsItem
>>> print(f"Total news items: {NewsItem.objects.count()}")
>>> print(f"Latest item: {NewsItem.objects.first()}")
```

## 🌐 网络问题

### 1. DNS解析问题

```bash
# 检查DNS配置
cat /etc/resolv.conf

# 测试DNS解析
nslookup api.siliconflow.cn
dig api.siliconflow.cn

# 使用公共DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

### 2. 防火墙问题

```bash
# 检查防火墙状态
sudo ufw status

# 开放必要端口
sudo ufw allow 3000
sudo ufw allow 5001
sudo ufw allow 8000

# 或临时关闭防火墙（仅测试用）
sudo ufw disable
```

### 3. 代理设置

```bash
# 检查代理设置
echo $http_proxy
echo $https_proxy

# 取消代理设置
unset http_proxy https_proxy

# 或在代码中配置代理
export http_proxy=http://proxy.company.com:8080
export https_proxy=http://proxy.company.com:8080
```

## ⚡ 性能问题

### 1. 响应时间慢

**数据库查询优化**:
```python
# 启用Django查询日志
LOGGING = {
    'loggers': {
        'django.db.backends': {
            'level': 'DEBUG',
            'handlers': ['console'],
        }
    }
}

# 检查慢查询
python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)
```

**添加数据库索引**:
```python
# 在models.py中添加索引
class NewsItem(models.Model):
    # ...
    class Meta:
        indexes = [
            models.Index(fields=['-timestamp']),
            models.Index(fields=['category']),
            models.Index(fields=['importance']),
        ]
```

### 2. 内存使用过高

**检查内存使用**:
```bash
# 检查进程内存使用
ps aux --sort=-%mem | head -10

# 检查系统内存
free -h

# 监控内存使用
top -p $(pgrep -d',' python)
```

**优化内存使用**:
```python
# 使用数据库分页
from django.core.paginator import Paginator

# 使用iterator减少内存使用
for item in NewsItem.objects.iterator():
    process_item(item)

# 清理不需要的对象
import gc
gc.collect()
```

### 3. CPU使用率高

**分析CPU使用**:
```bash
# 查看CPU使用情况
htop

# 分析Python进程
py-spy top --pid <python_pid>

# 生成性能报告
py-spy record -o profile.svg --pid <python_pid>
```

## 🚀 部署问题

### 1. 静态文件404

**收集静态文件**:
```bash
cd backend
python manage.py collectstatic --noinput

# 检查静态文件目录
ls -la static/

# 检查Django设置
python manage.py check --deploy
```

**Nginx静态文件配置**:
```nginx
location /static/ {
    alias /opt/ai_daily_news/backend/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. 权限问题

**文件权限**:
```bash
# 设置正确的文件权限
sudo chown -R ainews:ainews /opt/ai_daily_news
sudo chmod -R 755 /opt/ai_daily_news

# 设置日志目录权限
sudo mkdir -p /var/log/ai_daily_news
sudo chown ainews:ainews /var/log/ai_daily_news
```

**数据库权限**:
```sql
-- PostgreSQL权限问题
GRANT ALL PRIVILEGES ON DATABASE ai_daily_news TO ainews_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ainews_user;
```

### 3. Systemd服务问题

**服务无法启动**:
```bash
# 检查服务状态
sudo systemctl status ai-news-backend

# 查看详细日志
sudo journalctl -u ai-news-backend -f

# 重新加载配置
sudo systemctl daemon-reload
sudo systemctl restart ai-news-backend
```

**服务配置检查**:
```bash
# 检查服务文件
sudo systemctl cat ai-news-backend

# 测试服务文件
sudo systemd-analyze verify /etc/systemd/system/ai-news-backend.service
```

## 📊 日志分析

### 1. 日志位置

**开发环境日志**:
```bash
# Django控制台输出
python manage.py runserver

# AI代理日志
tail -f ai-news-agent/logs/app.log

# Nginx访问日志
tail -f /var/log/nginx/access.log
```

**生产环境日志**:
```bash
# 系统服务日志
sudo journalctl -u ai-news-backend -f
sudo journalctl -u ai-news-agent -f

# 应用日志
tail -f /var/log/ai_daily_news/django.log
tail -f /var/log/ai_daily_news/ai_agent.log

# Web服务器日志
tail -f /var/log/nginx/error.log
```

### 2. 日志级别配置

**Django日志级别**:
```python
# settings.py
LOGGING = {
    'loggers': {
        'root': {
            'level': 'INFO',  # DEBUG, INFO, WARNING, ERROR, CRITICAL
        },
        'django': {
            'level': 'WARNING',
        },
        'news': {
            'level': 'DEBUG',
        },
    },
}
```

**AI代理日志级别**:
```python
# config.py
LOG_LEVEL = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL

import logging
logging.basicConfig(level=getattr(logging, LOG_LEVEL))
```

### 3. 常见错误模式

**认证错误**:
```
Pattern: "401 Unauthorized"
Solution: 检查JWT token有效性
```

**数据库错误**:
```
Pattern: "psycopg2.OperationalError"
Solution: 检查数据库连接和权限
```

**API调用错误**:
```
Pattern: "HTTPError: 429 Too Many Requests"
Solution: 实现API调用限流和重试机制
```

## 🔧 调试工具

### 1. Django调试工具

```python
# 安装django-debug-toolbar
pip install django-debug-toolbar

# 在settings.py中配置
INSTALLED_APPS = [
    'debug_toolbar',
    # ...
]

MIDDLEWARE = [
    'debug_toolbar.middleware.DebugToolbarMiddleware',
    # ...
]
```

### 2. API调试工具

```bash
# 使用httpie
pip install httpie

# 测试API接口
http GET localhost:8000/api/news/ Authorization:"Bearer <token>"

# 使用curl详细输出
curl -v -H "Authorization: Bearer <token>" localhost:8000/api/news/
```

### 3. 性能分析工具

```bash
# 安装性能分析工具
pip install py-spy
pip install memory-profiler

# CPU性能分析
py-spy record -o profile.svg --pid <pid>

# 内存分析
python -m memory_profiler script.py
```

## 📞 获取帮助

如果以上解决方案都无法解决您的问题，请：

1. **查看项目文档**: [README.md](../README.md), [API文档](api-documentation.md)
2. **检查GitHub Issues**: [项目Issues](https://github.com/your-username/ai_daily_news/issues)
3. **创建新Issue**: 提供详细的错误信息、操作步骤和环境信息
4. **联系开发团队**: 通过项目仓库或邮件联系

### 问题报告模板

```markdown
**环境信息**:
- 操作系统: 
- Python版本: 
- Node.js版本: 
- 数据库: 

**错误描述**:
[详细描述遇到的问题]

**重现步骤**:
1. 
2. 
3. 

**错误日志**:
```
[粘贴相关错误日志]
```

**期望行为**:
[描述期望的正确行为]

**已尝试的解决方案**:
[列出已经尝试过的解决方法]
```

---

记住：遇到问题时保持冷静，按步骤排查，大多数问题都有解决方案。如果需要帮助，不要犹豫寻求支持！
