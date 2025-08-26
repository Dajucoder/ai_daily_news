# Docker环境聊天功能部署指南

## 📋 Docker文件修改总结

为了支持AI聊天功能，我已经更新了以下Docker相关文件：

### ✅ 已完成的修改

#### 1. docker-compose.yml
- **backend服务**：
  - 添加了聊天功能所需的环境变量
  - 添加了`collectstatic`命令以支持静态文件
  - 配置了PostgreSQL数据库连接

- **agent服务**：
  - 添加了AI服务相关环境变量
  - 确保与后端的聊天功能兼容

#### 2. backend/requirements.txt
- 添加了`psycopg2-binary==2.9.9`用于PostgreSQL支持
- 添加了`dj-database-url==2.1.0`用于数据库URL解析

#### 3. backend/ai_news_backend/settings.py
- 添加了数据库自动切换逻辑（开发环境用SQLite，Docker环境用PostgreSQL）
- 支持通过`DATABASE_URL`环境变量配置数据库

#### 4. .env.example
- 添加了AI聊天功能相关的环境变量：
  - `SILICONFLOW_BASE_URL`
  - `MODEL_NAME`

## 🚀 部署步骤

### 1. 配置环境变量
复制并配置环境文件：
```bash
cp .env.example .env
```

编辑`.env`文件，确保设置正确的API密钥：
```bash
# 修改这个值为您的真实API密钥
SILICONFLOW_API_KEY=your_actual_api_key_here
```

### 2. 构建和启动服务
```bash
# 构建并启动所有服务
docker-compose up --build

# 或者在后台运行
docker-compose up --build -d
```

### 3. 验证部署
服务启动后，您可以访问：
- **前端**: http://localhost:3000
- **后端API**: http://localhost:8000
- **AI代理**: http://localhost:5001
- **API文档**: http://localhost:8000/api/docs/

### 4. 首次设置
1. 访问 http://localhost:3000
2. 登录系统
3. 点击左侧导航的"AI聊天"
4. 创建新会话开始使用聊天功能

## 🔧 环境变量说明

### 必需配置
```bash
# AI服务API密钥（必须配置）
SILICONFLOW_API_KEY=your_api_key_here

# 数据库配置（已预配置，通常无需修改）
POSTGRES_DB=ai_news_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
```

### 可选配置
```bash
# AI服务基础URL（默认值通常无需修改）
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1

# AI模型名称（默认值通常无需修改）
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
```

## 📊 数据持久化

Docker配置已包含PostgreSQL数据持久化：
- 数据库数据存储在Docker卷`postgres_data`中
- 即使重启容器，聊天记录也会保留
- 媒体文件（如用户头像）会保存在后端容器的`/app/media`目录

## 🐛 故障排除

### 1. 迁移错误
如果遇到数据库迁移问题：
```bash
# 进入后端容器
docker-compose exec backend bash

# 手动运行迁移
python manage.py migrate

# 检查聊天应用迁移状态
python manage.py showmigrations chat
```

### 2. API密钥错误
确保在`.env`文件中正确设置了`SILICONFLOW_API_KEY`

### 3. 权限问题
如果遇到文件权限问题：
```bash
# 修复媒体文件权限
sudo chown -R 1000:1000 backend/media/
```

### 4. 容器日志查看
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs backend
docker-compose logs agent
```

## 🔄 服务管理

### 重启服务
```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
```

### 停止服务
```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（会丢失数据！）
docker-compose down -v
```

### 更新代码
```bash
# 拉取最新代码后重新构建
docker-compose down
docker-compose up --build
```

## ✅ 验证聊天功能

部署完成后，聊天功能应该完全可用：

1. ✅ 用户可以创建新的AI对话会话
2. ✅ 实时发送消息并获得AI回复
3. ✅ 会话历史自动保存到PostgreSQL数据库
4. ✅ 支持多会话管理
5. ✅ 可以调整AI参数设置

所有聊天数据都会安全地存储在PostgreSQL数据库中，通过Docker卷持久化保存。
