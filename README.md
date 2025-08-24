# AI Daily News 智能新闻聚合平台

一个基于AI的智能新闻聚合和分析平台，提供自动化新闻抓取、智能分析和个性化推荐功能。该平台专注于AI相关新闻资讯的收集、处理和展示，为用户提供高质量的AI行业资讯服务。

## 🚀 项目特性

- **🔄 智能新闻抓取**: 基于RSS源的自动化新闻收集，支持多个优质AI资讯源
- **🤖 AI内容分析**: 使用硅基流动Qwen2.5大模型进行新闻内容分析、分类和摘要生成
- **👥 用户管理系统**: 完整的用户注册、登录和权限管理，支持JWT身份认证
- **📊 数据可视化**: 新闻趋势和分析数据的直观可视化展示
- **🔍 搜索筛选**: 支持按分类、时间、重要程度等多维度搜索和筛选
- **📱 响应式设计**: 基于React 18和Ant Design的现代化响应式用户界面
- **🌐 RESTful API**: 完整的后端API接口，支持前后端分离架构
- **⚡ 实时更新**: 支持定时任务和手动触发的新闻抓取

## 🏗️ 项目架构

```
ai_daily_news/
├── ai-news-agent/          # AI新闻处理代理
├── backend/                # Django后端服务
├── frontend/               # React前端应用
├── docs/                   # 项目文档
└── README.md              # 项目说明
```

### 🛠️ 技术栈

**后端 (Backend)**
- Django 5.2 + Django REST Framework
- SQLite 数据库 (可扩展至PostgreSQL)
- JWT 身份认证
- Python 3.8+

**前端 (Frontend)**
- React 18 + TypeScript
- Ant Design 5.x 组件库
- Axios HTTP客户端
- React Router 7.x 路由管理
- Day.js 时间处理

**AI代理 (AI Agent)**
- Python 3.8+
- 硅基流动 API (Qwen2.5-7B-Instruct)
- RSS解析和处理 (feedparser)
- Flask API服务器
- 自动化新闻分析和分类

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

# 安装依赖
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

服务启动后，后端API将在 `http://localhost:8000` 运行

### 3. 前端设置

```bash
cd frontend
# 安装依赖
npm install

# 启动开发服务器
npm start
```

前端应用将在 `http://localhost:3000` 运行，并自动代理API请求到后端

### 4. AI代理设置

```bash
cd ai-news-agent
# 创建虚拟环境
python -m venv venv
# 激活虚拟环境 (Windows)
venv\Scripts\activate
# 激活虚拟环境 (macOS/Linux)
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 配置API密钥
export SILICONFLOW_API_KEY="your_api_key_here"

# 启动AI代理服务器
python api_server.py
```

AI代理服务将在 `http://localhost:5001` 运行

## 📖 使用指南

### 基本功能

1. **用户注册/登录**: 访问前端应用进行用户注册和登录
2. **新闻浏览**: 查看最新的AI相关新闻和分析
3. **个性化设置**: 配置新闻偏好和推荐设置
4. **数据分析**: 查看新闻趋势和统计数据

### API文档

后端提供完整的RESTful API，主要端点包括：

**认证接口**
- `POST /api/accounts/register/` - 用户注册
- `POST /api/accounts/login/` - 用户登录
- `POST /api/accounts/refresh/` - 刷新Token
- `POST /api/accounts/logout/` - 用户登出

**新闻接口**
- `GET /api/news/` - 获取新闻列表（支持分页、筛选）
- `GET /api/news/{id}/` - 获取新闻详情
- `POST /api/news/fetch/` - 触发新闻抓取
- `GET /api/news/categories/` - 获取新闻分类列表
- `GET /api/news/analytics/` - 获取新闻统计数据

**AI代理接口 (端口5001)**
- `GET /api/health` - 健康检查
- `GET /api/sources` - 获取RSS源列表
- `POST /api/fetch-news` - 开始抓取新闻
- `GET /api/reports/latest` - 获取最新报告

详细API文档请参考 `docs/api-documentation.md`

## 🔧 配置说明

**AI代理配置**
在使用AI代理前，需要设置硅基流动API密钥：

```bash
# 在ai-news-agent目录下
export SILICONFLOW_API_KEY="your_api_key_here"
```

或创建 `.env` 文件：
```env
SILICONFLOW_API_KEY=your_api_key_here
```

**RSS数据源**
系统默认配置了以下优质AI资讯源：
- Hugging Face博客
- Reddit机器学习社区
- MIT科技评论
- OpenAI官方博客
- DeepMind官方博客

**数据库配置**
项目默认使用SQLite数据库，无需额外配置。如需使用PostgreSQL，请修改Django设置文件。

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

## 📖 更多文档

- [开发规划文档](docs/development-plan.md) - 项目路线图和技术规划
- [API文档](docs/api-documentation.md) - 详细的API接口说明
- [部署指南](docs/deployment-guide.md) - 生产环境部署说明
- [故障排除](docs/troubleshooting.md) - 常见问题解决方案

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/ai_daily_news)
- 问题反馈: [GitHub Issues](https://github.com/your-username/ai_daily_news/issues)
- 贡献指南: [CONTRIBUTING.md](CONTRIBUTING.md)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

⭐ 如果这个项目对你有帮助，请给我们一个星标！