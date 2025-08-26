# 故障排除指南

本文档提供 AI Daily News 系统常见问题的诊断和解决方案。

## 📋 目录

- [系统启动问题](#系统启动问题)
- [数据库连接问题](#数据库连接问题)
- [AI服务问题](#ai服务问题)
- [前端访问问题](#前端访问问题)
- [性能问题](#性能问题)
- [日志分析](#日志分析)

## 🚀 系统启动问题

### Docker容器启动失败

**症状:** 容器无法启动或立即退出

**诊断步骤:**
```bash
# 查看容器状态
docker-compose ps

# 查看容器日志
docker-compose logs [service_name]

# 查看详细错误信息
docker-compose logs --tail=50 -f [service_name]
```

**常见原因和解决方案:**

1. **端口冲突**
   ```bash
   # 检查端口占用
   sudo netstat -tulpn | grep :8000
   
   # 解决方案：修改docker-compose.yml中的端口映射
   ports:
     - "8001:8000"  # 改为其他端口
   ```

2. **环境变量缺失**
   ```bash
   # 检查.env文件是否存在
   ls -la .env
   
   # 验证关键环境变量
   grep -E "SECRET_KEY|DATABASE_URL|SILICONFLOW_API_KEY" .env
   ```

3. **磁盘空间不足**
   ```bash
   # 检查磁盘空间
   df -h
   
   # 清理Docker资源
   docker system prune -a
   ```

## 🗄️ 数据库连接问题

### 连接被拒绝

**症状:** `connection refused` 或 `could not connect to server`

**诊断步骤:**
```bash
# 检查数据库容器状态
docker-compose ps db

# 测试数据库连接
docker-compose exec backend python manage.py dbshell

# 检查数据库日志
docker-compose logs db
```

**解决方案:**

1. **检查数据库配置**
   ```python
   # 确保使用正确的数据库主机名
   DATABASE_URL=postgresql://user:password@db:5432/ai_news_db
   ```

2. **重置数据库**
   ```bash
   # 停止服务
   docker-compose down
   
   # 删除数据库卷
   docker volume rm ai_daily_news_postgres_data
   
   # 重新启动
   docker-compose up -d
   ```

### 迁移失败

**症状:** 数据库迁移执行失败

**解决方案:**
```bash
# 查看迁移状态
docker-compose exec backend python manage.py showmigrations

# 手动执行迁移
docker-compose exec backend python manage.py migrate

# 如果迁移冲突，重置迁移
docker-compose exec backend python manage.py migrate --fake-initial
```

## 🤖 AI服务问题

### API密钥无效

**症状:** AI代理返回认证错误

**诊断步骤:**
```bash
# 检查环境变量
docker-compose exec agent printenv | grep SILICONFLOW

# 测试API连接
docker-compose exec backend python test_ai_connection.py
```

**解决方案:**
1. 验证API密钥是否正确
2. 检查API额度是否充足
3. 确认API服务是否可用

### RSS抓取失败

**症状:** 新闻抓取返回空结果或错误

**诊断步骤:**
```bash
# 查看代理日志
docker-compose logs agent

# 手动测试RSS源
docker-compose exec agent python -c "
import feedparser
feed = feedparser.parse('https://huggingface.co/blog/feed.xml')
print(f'获取到 {len(feed.entries)} 条新闻')
"
```

**解决方案:**
1. 检查网络连接
2. 验证RSS源URL是否有效
3. 检查防火墙设置

## 🌐 前端访问问题

### 页面无法加载

**症状:** 浏览器显示连接错误或404

**诊断步骤:**
```bash
# 检查前端容器状态
docker-compose ps frontend

# 检查Nginx配置
docker-compose exec frontend nginx -t

# 查看前端日志
docker-compose logs frontend
```

**解决方案:**
1. 检查端口映射是否正确
2. 验证Nginx配置文件
3. 确认静态文件是否正确构建

### API调用失败

**症状:** 前端无法获取数据，控制台显示网络错误

**诊断步骤:**
```bash
# 检查API端点
curl http://localhost:8000/api/health

# 检查CORS配置
grep -r "CORS_ALLOWED_ORIGINS" backend/
```

**解决方案:**
1. 更新CORS配置
2. 检查API基础URL配置
3. 验证认证Token是否有效

## ⚡ 性能问题

### 响应速度慢

**症状:** 页面加载缓慢，API响应时间长

**诊断步骤:**
```bash
# 检查系统资源使用
docker stats

# 分析数据库查询
docker-compose exec backend python manage.py shell
>>> from django.db import connection
>>> print(connection.queries)
```

**优化方案:**
1. 添加数据库索引
2. 启用查询缓存
3. 优化前端资源加载
4. 增加服务器资源

### 内存使用过高

**症状:** 容器内存使用率持续上升

**解决方案:**
```bash
# 限制容器内存使用
# 在docker-compose.yml中添加
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
```

## 📊 日志分析

### 查看系统日志

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend

# 实时查看日志
docker-compose logs -f --tail=100

# 查看错误日志
docker-compose logs | grep ERROR
```

### 常见错误模式

1. **数据库连接错误**
   ```
   django.db.utils.OperationalError: could not connect to server
   ```
   解决：检查数据库服务状态和连接配置

2. **AI API错误**
   ```
   openai.AuthenticationError: Incorrect API key provided
   ```
   解决：验证API密钥配置

3. **内存不足错误**
   ```
   MemoryError: Unable to allocate array
   ```
   解决：增加容器内存限制或优化代码

### 日志配置优化

```python
# backend/ai_news_backend/settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['file'],
        'level': 'INFO',
    },
}
```

## 🔧 常用调试命令

### Docker相关

```bash
# 进入容器shell
docker-compose exec backend bash
docker-compose exec frontend sh

# 重启特定服务
docker-compose restart backend

# 查看容器资源使用
docker stats

# 清理未使用的资源
docker system prune -a
```

### Django相关

```bash
# 进入Django shell
docker-compose exec backend python manage.py shell

# 检查数据库连接
docker-compose exec backend python manage.py dbshell

# 运行测试
docker-compose exec backend python manage.py test

# 收集静态文件
docker-compose exec backend python manage.py collectstatic
```

### 网络诊断

```bash
# 测试容器间网络连接
docker-compose exec backend ping db
docker-compose exec frontend ping backend

# 检查端口监听
docker-compose exec backend netstat -tulpn

# 测试外部网络连接
docker-compose exec agent curl -I https://api.siliconflow.cn
```

## 🆘 紧急恢复

### 快速重启

```bash
# 完全重启系统
docker-compose down
docker-compose up -d

# 重建并重启
docker-compose down
docker-compose up --build -d
```

### 数据恢复

```bash
# 从备份恢复数据库
docker-compose exec -T db psql -U ai_news_user ai_news_db < backup.sql

# 恢复媒体文件
docker cp backup_media/. $(docker-compose ps -q frontend):/app/media/
```

### 回滚部署

```bash
# 切换到上一个稳定版本
git checkout previous_stable_tag
docker-compose down
docker-compose up --build -d
```

## 📞 获取帮助

如果以上解决方案无法解决问题，请：

1. **收集诊断信息**
   ```bash
   # 生成系统报告
   docker-compose ps > system_status.txt
   docker-compose logs > system_logs.txt
   docker system df > docker_usage.txt
   ```

2. **联系技术支持**
   - 邮箱：support@example.com
   - GitHub Issues：提交详细的错误报告
   - 文档：查看在线文档获取更多信息

3. **社区支持**
   - 加入开发者群组
   - 参与GitHub Discussions
   - 查看FAQ文档

---

定期维护和监控可以预防大多数问题的发生。建议建立完善的监控和告警机制。