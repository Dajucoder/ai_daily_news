# AI Daily News 智能新闻聚合平台

一个基于AI的智能新闻聚合和分析平台，提供自动化新闻抓取、智能分析和个性化推荐功能。

## 🚀 项目特性

- **智能新闻抓取**: 基于RSS源的自动化新闻收集
- **AI内容分析**: 使用大语言模型进行新闻内容分析和摘要
- **用户管理系统**: 完整的用户注册、登录和权限管理
- **个性化推荐**: 基于用户偏好的智能新闻推荐
- **数据可视化**: 新闻趋势和分析数据的可视化展示
- **RESTful API**: 完整的后端API接口
- **现代化前端**: 基于React的响应式用户界面

## 🏗️ 项目架构

```
ai_daily_news/
├── ai-news-agent/          # AI新闻处理代理
├── backend/                # Django后端服务
├── frontend/               # React前端应用
├── docs/                   # 项目文档
└── README.md              # 项目说明
```

### 技术栈

**后端 (Backend)**
- Django 4.x + Django REST Framework
- PostgreSQL/SQLite 数据库
- JWT 身份认证
- Celery 异步任务处理

**前端 (Frontend)**
- React 18 + TypeScript
- Material-UI / Ant Design
- Axios HTTP客户端
- React Router 路由管理

**AI代理 (AI Agent)**
- Python 3.8+
- OpenAI GPT API
- RSS解析和处理
- 自动化新闻分析

## 🛠️ 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- PostgreSQL (可选，默认使用SQLite)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

### 2. 后端设置

```bash
cd backend
# 创建虚拟环境
python -m venv venv
# 激活虚拟环境 (Windows)
venv\Scripts\activate
# 激活虚拟环境 (macOS/Linux)
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# 编辑.env文件配置数据库和API密钥
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 3. 前端设置

```bash
cd frontend
npm install
cp .env.example .env
# 编辑.env文件配置API端点
npm start
```

### 4. AI代理设置

```bash
cd ai-news-agent
# 创建虚拟环境
python -m venv venv
# 激活虚拟环境 (Windows)
venv\Scripts\activate
# 激活虚拟环境 (macOS/Linux)
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# 编辑.env文件配置OpenAI API密钥
python api_server.py
```

## 📖 使用指南

### 基本功能

1. **用户注册/登录**: 访问前端应用进行用户注册和登录
2. **新闻浏览**: 查看最新的AI相关新闻和分析
3. **个性化设置**: 配置新闻偏好和推荐设置
4. **数据分析**: 查看新闻趋势和统计数据

### API文档

后端提供完整的RESTful API，主要端点包括：

- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/register/` - 用户注册
- `GET /api/news/` - 获取新闻列表
- `GET /api/news/{id}/` - 获取新闻详情
- `GET /api/analytics/` - 获取分析数据

详细API文档请参考 `docs/api.md`

## 🔧 配置说明

### 环境变量

**后端配置 (backend/.env)**
```
SECRET_KEY=your-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3
OPENAI_API_KEY=your-openai-api-key
```

**前端配置 (frontend/.env)**
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_WS_URL=ws://localhost:8000/ws
```

**AI代理配置 (ai-news-agent/.env)**
```
OPENAI_API_KEY=your-openai-api-key
RSS_SOURCES=source1.xml,source2.xml
OUTPUT_DIR=./output
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细的贡献指南。

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📝 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/ai_daily_news)
- 问题反馈: [Issues](https://github.com/your-username/ai_daily_news/issues)
- 邮箱: your-email@example.com

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！