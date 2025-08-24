# 贡献指南 🤝

感谢您对 AI Daily News 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、设计、测试等。

## 🚀 快速开始

### 开发环境设置

1. **Fork 项目**
   ```bash
   # 在 GitHub 上 Fork 项目到你的账户
   git clone https://github.com/YOUR_USERNAME/ai_daily_news.git
   cd ai_daily_news
   ```

2. **设置上游仓库**
   ```bash
   git remote add upstream https://github.com/Dajucoder/ai_daily_news.git
   ```

3. **安装依赖**
   ```bash
   # 后端依赖
   cd backend
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # 前端依赖
   cd ../frontend
   npm install
   ```

4. **配置环境**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入必要的配置
   ```

## 📋 贡献类型

### 🐛 Bug 修复
- 修复现有功能的问题
- 提供详细的问题描述和复现步骤
- 包含相关的测试用例

### ✨ 新功能
- 添加新的功能特性
- 确保功能设计合理且有用
- 提供完整的文档说明

### 📚 文档改进
- 改进 README、API 文档等
- 添加代码注释和示例
- 翻译文档到其他语言

### 🎨 UI/UX 改进
- 改进用户界面设计
- 优化用户体验
- 响应式设计改进

### ⚡ 性能优化
- 优化代码性能
- 减少资源消耗
- 提高响应速度

## 🔄 开发流程

### 1. 创建分支
```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b fix/your-bug-fix
```

### 2. 开发和测试
```bash
# 后端测试
cd backend && python manage.py test

# 前端测试
cd frontend && npm test

# 代码格式检查
cd frontend && npm run lint
```

### 3. 提交代码
```bash
git add .
git commit -m "feat: add amazing new feature"
```

### 4. 推送分支
```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request
- 在 GitHub 上创建 Pull Request
- 填写详细的描述信息
- 关联相关的 Issue（如果有）

## 📝 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交类型
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 提交格式
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 示例
```bash
feat(api): add news search functionality
fix(ui): resolve mobile responsive issues
docs(readme): update installation instructions
```

## 🧪 测试指南

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
npm run test:coverage
```

### 集成测试
```bash
# 启动后端服务
cd backend && python manage.py runserver

# 在另一个终端启动前端
cd frontend && npm start

# 手动测试主要功能流程
```

## 📋 代码规范

### Python (后端)
- 遵循 [PEP 8](https://www.python.org/dev/peps/pep-0008/) 规范
- 使用 `black` 进行代码格式化
- 使用 `flake8` 进行代码检查
- 添加适当的类型注解

### TypeScript (前端)
- 遵循 ESLint 配置规则
- 使用 Prettier 进行代码格式化
- 保持组件的单一职责原则
- 使用 TypeScript 类型系统

### 通用规范
- 使用有意义的变量和函数名
- 添加必要的注释和文档字符串
- 保持代码简洁和可读性
- 遵循 DRY (Don't Repeat Yourself) 原则

## 🔍 代码审查

### 审查要点
- 代码功能是否正确实现
- 是否遵循项目的代码规范
- 是否有适当的测试覆盖
- 是否有安全隐患
- 性能是否有问题

### 审查流程
1. 自动化检查（CI/CD）
2. 代码审查（Code Review）
3. 测试验证
4. 合并到主分支

## 🐛 问题报告

### 报告 Bug
使用 [GitHub Issues](https://github.com/Dajucoder/ai_daily_news/issues) 报告问题：

1. 使用清晰的标题描述问题
2. 提供详细的复现步骤
3. 包含错误信息和截图
4. 说明期望的行为
5. 提供环境信息（操作系统、浏览器等）

### Bug 报告模板
```markdown
**问题描述**
简要描述遇到的问题

**复现步骤**
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

**期望行为**
描述你期望发生的情况

**截图**
如果适用，添加截图来帮助解释问题

**环境信息**
- 操作系统: [例如 iOS]
- 浏览器: [例如 chrome, safari]
- 版本: [例如 22]

**附加信息**
添加任何其他相关的信息
```

## 💡 功能请求

### 提出新功能
1. 检查是否已有类似的功能请求
2. 详细描述功能需求和使用场景
3. 说明功能的价值和必要性
4. 提供可能的实现方案

## 🎯 开发优先级

### 高优先级
- 安全漏洞修复
- 核心功能 Bug 修复
- 性能优化
- 用户体验改进

### 中优先级
- 新功能开发
- 代码重构
- 文档完善
- 测试覆盖率提升

### 低优先级
- 代码风格调整
- 非核心功能优化
- 实验性功能

## 🏆 贡献者认可

我们重视每一位贡献者的努力：

- 贡献者将被添加到项目的 Contributors 列表
- 重要贡献会在 Release Notes 中特别感谢
- 持续贡献者可能被邀请成为项目维护者

## 📞 联系方式

如果你有任何问题或建议，可以通过以下方式联系我们：

- GitHub Issues: [项目问题页面](https://github.com/Dajucoder/ai_daily_news/issues)
- GitHub Discussions: [项目讨论页面](https://github.com/Dajucoder/ai_daily_news/discussions)
- Email: dajucoder@example.com

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🙏