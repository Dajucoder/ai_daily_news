# AI Daily News 🤖📰

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Django](https://img.shields.io/badge/Django-5.2+-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18+-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6.svg)](https://www.typescriptlang.org/)

一个基于AI的智能新闻聚合和分析平台，采用现代化的前后端分离架构，自动获取、分析和展示AI相关新闻资讯。

## ✨ 主要功能特性

### 🔍 智能新闻获取
- **自动化采集**: 定时从多个权威科技媒体获取AI相关新闻
- **智能去重**: 基于内容相似度的智能去重算法
- **多源聚合**: 支持多个新闻源的统一管理和展示

### 🧠 AI驱动分析
- **内容摘要**: 使用硅基流动AI服务生成新闻摘要
- **重要性评级**: 智能评估新闻的重要程度
- **分类标签**: 自动为新闻添加相关分类标签

### 📊 数据可视化
- **统计面板**: 实时展示新闻统计数据和趋势
- **交互式图表**: 直观的数据可视化展示
- **进度监控**: 实时显示新闻获取和处理进度

### 🔎 高级搜索
- **多维筛选**: 支持按分类、重要性、时间等多维度筛选
- **全文搜索**: 支持标题和内容的全文搜索
- **智能排序**: 按时间、重要性等多种方式排序

## 🏗️ 技术架构

### 后端技术栈
- **框架**: Django 5.2 + Django REST Framework
- **数据库**: SQLite (可扩展至PostgreSQL/MySQL)
- **AI服务**: 硅基流动 (SiliconFlow) API
- **API文档**: Swagger/OpenAPI 3.0

### 前端技术栈
- **框架**: React 18 + TypeScript
- **UI库**: Ant Design
- **状态管理**: React Hooks
- **HTTP客户端**: Axios
- **路由**: React Router

### 架构特点
- 🔄 **前后端分离**: RESTful API设计，前后端完全解耦
- 📱 **响应式设计**: 支持桌面端和移动端访问
- 🔒 **类型安全**: TypeScript提供完整的类型检查
- 🚀 **高性能**: 优化的数据库查询和前端渲染

## 🚀 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/Dajucoder/ai_daily_news.git
   cd ai_daily_news
   ```

2. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入你的硅基流动API密钥
   ```

3. **后端设置**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py createsuperuser  # 创建管理员账户
   ```

4. **前端设置**
   ```bash
   cd frontend
   npm install
   ```

5. **启动服务**
   
   **方式一：使用启动脚本**
   ```bash
   # Linux/Mac
   ./start.sh
   
   # Windows
   start.bat
   ```
   
   **方式二：手动启动**
   ```bash
   # 启动后端 (终端1)
   cd backend && source venv/bin/activate && python manage.py runserver
   
   # 启动前端 (终端2)
   cd frontend && npm start
   ```

6. **访问应用**
   - 前端应用: http://localhost:3000
   - 后端API: http://localhost:8000/api/
   - API文档: http://localhost:8000/api/docs/
   - 管理后台: http://localhost:8000/admin/

## 📖 使用指南

### 获取API密钥

1. 访问 [硅基流动官网](https://cloud.siliconflow.cn/)
2. 注册账户并获取API密钥
3. 将密钥填入 `.env` 文件的 `SILICONFLOW_API_KEY` 字段

### 基本操作

1. **获取新闻**: 点击"获取新闻"按钮开始自动获取和分析新闻
2. **查看统计**: 在仪表板查看新闻统计和趋势数据
3. **搜索筛选**: 使用搜索框和筛选器查找特定新闻
4. **查看详情**: 点击新闻标题查看完整内容和分析结果

### API使用

项目提供完整的RESTful API，支持：

- `GET /api/news/` - 获取新闻列表
- `GET /api/news/{id}/` - 获取新闻详情
- `GET /api/news/stats/` - 获取统计数据
- `POST /api/service/fetch_news/` - 触发新闻获取
- `GET /api/service/fetch_status/` - 获取处理状态

详细API文档请访问: http://localhost:8000/api/docs/

## 🛠️ 开发指南

### 项目结构

```
ai_daily_news/
├── backend/                 # Django后端
│   ├── ai_news_backend/    # 项目配置
│   ├── news/               # 新闻应用
│   │   ├── models.py       # 数据模型
│   │   ├── views.py        # API视图
│   │   ├── serializers.py  # 序列化器
│   │   └── services.py     # 业务逻辑
│   └── requirements.txt    # Python依赖
├── frontend/               # React前端
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── services/       # API服务
│   │   └── types/          # TypeScript类型
│   └── package.json        # Node.js依赖
├── .env.example            # 环境变量模板
├── .gitignore             # Git忽略文件
└── README.md              # 项目文档
```

### 开发规范

- **代码风格**: 遵循PEP 8 (Python) 和 ESLint (TypeScript)
- **提交规范**: 使用语义化提交信息
- **分支管理**: 使用Git Flow工作流
- **测试覆盖**: 编写单元测试和集成测试

### 扩展开发

1. **添加新闻源**: 在 `backend/news/services.py` 中扩展新闻获取逻辑
2. **自定义分析**: 修改AI分析提示词和处理逻辑
3. **UI定制**: 在 `frontend/src/components/` 中添加新组件
4. **API扩展**: 在 `backend/news/views.py` 中添加新的API端点

## 🧪 测试

### 后端测试
```bash
cd backend
source venv/bin/activate
python manage.py test
```

### 前端测试
```bash
cd frontend
npm test
```

## 📦 部署

### Docker部署 (推荐)

```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

### 传统部署

1. **后端部署**
   - 使用 Gunicorn + Nginx
   - 配置PostgreSQL数据库
   - 设置环境变量

2. **前端部署**
   - 构建生产版本: `npm run build`
   - 部署到CDN或静态文件服务器

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

### 贡献流程

1. **Fork项目** 到你的GitHub账户
2. **创建特性分支** (`git checkout -b feature/AmazingFeature`)
3. **提交更改** (`git commit -m 'Add some AmazingFeature'`)
4. **推送分支** (`git push origin feature/AmazingFeature`)
5. **创建Pull Request**

### 贡献类型

- 🐛 **Bug修复**: 修复现有功能的问题
- ✨ **新功能**: 添加新的功能特性
- 📚 **文档**: 改进项目文档
- 🎨 **UI/UX**: 改进用户界面和体验
- ⚡ **性能**: 优化性能和效率
- 🧪 **测试**: 添加或改进测试用例

### 代码规范

- 遵循现有的代码风格
- 添加适当的注释和文档
- 确保所有测试通过
- 更新相关文档

## 📄 许可证

本项目采用 [MIT License](LICENSE) 开源许可证。

## 🙏 致谢

- [硅基流动](https://cloud.siliconflow.cn/) - 提供AI服务支持
- [Django](https://www.djangoproject.com/) - 强大的Python Web框架
- [React](https://reactjs.org/) - 优秀的前端框架
- [Ant Design](https://ant.design/) - 企业级UI设计语言

## 📞 联系方式

- **作者**: Dajucoder
- **项目地址**: https://github.com/Dajucoder/ai_daily_news
- **问题反馈**: [GitHub Issues](https://github.com/Dajucoder/ai_daily_news/issues)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！