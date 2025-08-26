# AI聊天功能设置指南

## 功能介绍

本系统已成功集成了AI聊天功能，可以直接与大模型进行对话，并且会话会自动保存到数据库中。

## 功能特性

- ✅ **实时对话**：支持与AI大模型进行实时对话
- ✅ **会话管理**：可以创建、编辑、删除会话
- ✅ **消息存储**：所有对话消息都会保存到数据库
- ✅ **设置调节**：可以调整模型参数（温度、最大Token数等）
- ✅ **响应式界面**：美观的聊天界面，支持桌面和移动设备

## 环境配置

### 1. 配置API密钥

在项目根目录创建 `.env` 文件（或修改现有的）：

```bash
# 硅基流动API密钥（必需）
SILICONFLOW_API_KEY=your_siliconflow_api_key_here

# 可选配置
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct
```

### 2. 数据库迁移

聊天功能的数据库表已经创建完成，如果是新环境，请运行：

```bash
cd backend
source venv/bin/activate
python manage.py migrate
```

## 使用说明

### 1. 启动服务

#### 后端服务
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

#### 前端服务
```bash
cd frontend
npm start
```

### 2. 访问聊天功能

1. 登录系统后，在左侧导航栏点击 "AI聊天"
2. 点击 "新建会话" 创建新的对话
3. 在输入框中输入消息，按Enter发送
4. AI会自动回复，所有对话都会保存

### 3. 功能操作

- **创建会话**：点击"新建会话"按钮
- **切换会话**：点击左侧会话列表中的任意会话
- **编辑标题**：点击会话右侧的更多按钮，选择"编辑标题"
- **删除会话**：点击会话右侧的更多按钮，选择"删除会话"
- **调整设置**：点击右上角的设置按钮，可以调整AI模型参数

## API接口

聊天功能提供了以下API接口：

- `GET /api/chat/conversations/` - 获取会话列表
- `POST /api/chat/conversations/` - 创建新会话
- `GET /api/chat/conversations/{id}/` - 获取会话详情
- `DELETE /api/chat/conversations/{id}/` - 删除会话
- `POST /api/chat/send-message/` - 发送消息
- `GET /api/chat/settings/` - 获取聊天设置
- `PATCH /api/chat/settings/` - 更新聊天设置

## 技术架构

### 后端
- **Django REST Framework**：提供API接口
- **OpenAI库**：调用硅基流动API
- **SQLite/PostgreSQL**：存储会话和消息数据

### 前端
- **React + TypeScript**：现代化前端框架
- **Ant Design**：UI组件库
- **Axios**：HTTP客户端

### 数据模型
- **Conversation**：会话模型，存储会话信息
- **Message**：消息模型，存储对话消息
- **ChatSettings**：聊天设置模型，存储用户偏好

## 故障排除

### 1. API密钥错误
确保在 `.env` 文件中正确配置了 `SILICONFLOW_API_KEY`

### 2. 网络连接问题
检查网络连接，确保可以访问硅基流动API服务

### 3. 前端显示问题
确保moment.js依赖已安装：
```bash
cd frontend
npm install moment
```

### 4. 数据库问题
如果遇到数据库错误，重新运行迁移：
```bash
python manage.py migrate
```

## 开发说明

如果需要自定义或扩展聊天功能：

1. **后端开发**：修改 `backend/chat/` 目录下的文件
2. **前端开发**：修改 `frontend/src/components/Chat.tsx`
3. **API接口**：查看 `backend/chat/urls.py` 了解接口路由

聊天功能已完全集成到现有系统中，可以立即使用！
