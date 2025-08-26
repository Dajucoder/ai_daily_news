# AI Daily News 智能新闻系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-5.2+-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18.3+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)

## 📖 项目简介

AI Daily News 是一个基于人工智能的智能新闻聚合与分析系统，旨在为用户提供个性化、高质量的新闻内容。系统通过RSS源自动获取新闻，利用AI技术进行内容分析、摘要生成和智能推荐，为用户打造个性化的新闻阅读体验。

### 核心价值
- **智能聚合**：自动从多个RSS源获取新闻内容
- **AI分析**：利用大语言模型进行新闻分析和摘要
- **个性化推荐**：基于用户偏好的智能推荐算法
- **实时交互**：支持与AI助手进行新闻相关对话

## ✨ 功能特性

### 🤖 AI驱动的核心功能
- **智能新闻获取**：支持多RSS源自动抓取和去重
- **AI内容分析**：基于SiliconFlow API的新闻摘要和分析
- **智能对话系统**：支持流式响应的AI聊天功能
- **思维过程展示**：可视化AI的思考过程

### 📊 数据管理与分析
- **新闻数据管理**：完整的CRUD操作和分页查询
- **获取历史记录**：详细的新闻获取日志和统计
- **用户行为分析**：阅读偏好和互动数据统计
- **系统监控**：实时性能监控和错误追踪

### 🎨 现代化用户界面
- **响应式设计**：基于Ant Design的现代UI组件
- **实时更新**：WebSocket支持的实时数据推送
- **多主题支持**：明暗主题切换
- **移动端适配**：完整的移动端体验

### 🔐 安全与认证
- **JWT认证**：基于Token的安全认证机制
- **用户权限管理**：细粒度的权限控制
- **API安全**：完整的API访问控制和限流
- **数据加密**：敏感数据的加密存储

## 🏗️ 技术架构

### 后端技术栈
- **框架**：Django 5.2 + Django REST Framework
- **数据库**：PostgreSQL (生产) / SQLite (开发)
- **AI集成**：SiliconFlow API + OpenAI SDK
- **认证**：JWT + Django Simple JWT
- **API文档**：drf-spectacular (OpenAPI 3.0)

### 前端技术栈
- **框架**：React 18.3 + TypeScript 4.9
- **UI库**：Ant Design 5.27
- **状态管理**：React Context API
- **路由**：React Router DOM 7.8
- **HTTP客户端**：Axios 1.11

### AI新闻代理
- **语言**：Python 3.8+
- **框架**：Flask + OpenAI SDK
- **RSS处理**：feedparser
- **任务调度**：APScheduler

### 部署与运维
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx
- **进程管理**：Gunicorn
- **环境管理**：python-dotenv

## 🚀 安装部署

### 环境要求
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose (可选)
- PostgreSQL (生产环境)

### 快速开始

#### 1. 克隆项目
```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

#### 2. 环境配置
```bash
# 复制环境变量模板
cp .env.example .env
cp ai-news-agent/.env.example ai-news-agent/.env
cp frontend/.env.example frontend/.env

# 编辑环境变量
vim .env  # 配置数据库、AI API等
```

#### 3. Docker部署（推荐）
```bash
# 开发环境
docker-compose -f docker-compose.dev.yml up -d

# 生产环境
docker-compose up -d
```

#### 4. 手动部署

**后端部署**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate
python manage.py createsuperuser

# 启动服务
python manage.py runserver 0.0.0.0:8000
```

**前端部署**
```bash
cd frontend
npm install
npm start  # 开发环境
npm run build  # 生产构建
```

**AI新闻代理**
```bash
cd ai-news-agent
pip install -r requirements.txt
python start.py
```

### 环境变量配置

#### 主要环境变量
```env
# Django配置
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=postgresql://user:password@localhost:5432/ai_news

# AI服务配置
SILICONFLOW_API_KEY=your-siliconflow-api-key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# 新闻代理配置
NEWS_AGENT_BASE_URL=http://localhost:5001
```

## 📚 使用说明

### 基础用法

#### 1. 用户注册与登录
- 访问 `http://localhost:3000` 进入系统
- 注册新用户或使用管理员账户登录
- 系统支持JWT Token认证

#### 2. 新闻管理
- **查看新闻**：在新闻列表页面浏览最新新闻
- **搜索过滤**：支持关键词搜索和分类过滤
- **详情查看**：点击新闻标题查看详细内容

#### 3. AI对话功能
- **智能问答**：在聊天页面与AI助手对话
- **新闻分析**：询问AI关于特定新闻的分析
- **思维过程**：查看AI的思考过程和推理步骤

#### 4. 系统管理
- **RSS源管理**：添加、编辑RSS新闻源
- **获取历史**：查看新闻获取日志和统计
- **用户管理**：管理用户权限和设置

### 高级配置

#### AI模型配置
```python
# 在Django管理后台或通过API配置
{
    "model_name": "Qwen/Qwen2.5-7B-Instruct",
    "temperature": 0.7,
    "max_tokens": 2000,
    "system_prompt": "你是一个专业的新闻分析助手..."
}
```

#### RSS源配置
```json
{
    "name": "技术新闻",
    "url": "https://example.com/rss",
    "category": "technology",
    "enabled": true,
    "fetch_interval": 3600
}
```

### API使用

#### 认证
```bash
# 获取Token
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "password"}'

# 使用Token
curl -H "Authorization: Bearer your-token" \
  http://localhost:8000/api/news/
```

#### 主要API端点
- `GET /api/news/` - 获取新闻列表
- `POST /api/chat/send/` - 发送聊天消息
- `GET /api/news/fetch-history/` - 获取抓取历史
- `POST /api/ai-config/` - 配置AI参数

详细API文档请访问：`http://localhost:8000/api/schema/swagger-ui/`

## 🤝 贡献规范

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

### 快速贡献流程

1. **Fork项目** 到你的GitHub账户
2. **创建特性分支** `git checkout -b feature/amazing-feature`
3. **提交更改** `git commit -m 'Add some amazing feature'`
4. **推送分支** `git push origin feature/amazing-feature`
5. **创建Pull Request**

### 开发规范
- 遵循PEP 8 (Python) 和 ESLint (JavaScript/TypeScript) 代码规范
- 编写单元测试覆盖新功能
- 更新相关文档
- 确保所有测试通过

### 提交信息规范
```
type(scope): description

feat(news): add RSS source management
fix(chat): resolve streaming response issue
docs(readme): update installation guide
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🔗 相关链接

- [项目文档](docs/)
- [API文档](http://localhost:8000/api/schema/swagger-ui/)
- [问题反馈](https://github.com/your-username/ai_daily_news/issues)
- [更新日志](CHANGELOG.md)

## 🙏 致谢

感谢以下开源项目和服务：
- [Django](https://www.djangoproject.com/) - Web框架
- [React](https://reactjs.org/) - 前端框架
- [Ant Design](https://ant.design/) - UI组件库
- [SiliconFlow](https://siliconflow.cn/) - AI服务提供商

---

如果这个项目对你有帮助，请给我们一个 ⭐️！