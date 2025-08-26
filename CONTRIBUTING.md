# 贡献指南

感谢您对 AI Daily News 项目的关注！我们欢迎所有形式的贡献，包括但不限于代码、文档、测试、反馈和建议。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境设置](#开发环境设置)
- [代码规范](#代码规范)
- [提交规范](#提交规范)
- [Pull Request 流程](#pull-request-流程)
- [问题报告](#问题报告)
- [功能请求](#功能请求)

## 🤝 行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺，无论年龄、体型、残疾、种族、性别认同和表达、经验水平、教育程度、社会经济地位、国籍、个人形象、种族、宗教或性取向如何，参与我们项目和社区的每个人都能获得无骚扰的体验。

### 我们的标准

有助于创造积极环境的行为包括：
- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性批评
- 关注对社区最有利的事情
- 对其他社区成员表示同理心

## 🚀 如何贡献

### 贡献类型

我们欢迎以下类型的贡献：

1. **代码贡献**
   - 新功能开发
   - Bug修复
   - 性能优化
   - 代码重构

2. **文档贡献**
   - API文档完善
   - 使用指南编写
   - 代码注释改进
   - 翻译工作

3. **测试贡献**
   - 单元测试编写
   - 集成测试完善
   - 性能测试
   - 用户体验测试

4. **其他贡献**
   - 问题报告
   - 功能建议
   - 设计改进
   - 社区支持

## 🛠️ 开发环境设置

### 前置要求

- Python 3.8+
- Node.js 16+
- Git
- Docker & Docker Compose (可选)

### 环境搭建

1. **Fork 并克隆项目**
```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

2. **设置开发环境**
```bash
# 复制环境变量
cp .env.example .env
cp ai-news-agent/.env.example ai-news-agent/.env
cp frontend/.env.example frontend/.env

# 使用Docker快速启动
docker-compose -f docker-compose.dev.yml up -d
```

3. **手动环境设置**

**后端环境**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
```

**前端环境**
```bash
cd frontend
npm install
```

**AI代理环境**
```bash
cd ai-news-agent
pip install -r requirements.txt
```

### 开发服务启动

```bash
# 后端服务 (端口 8000)
cd backend && python manage.py runserver

# 前端服务 (端口 3000)
cd frontend && npm start

# AI代理服务 (端口 5001)
cd ai-news-agent && python start.py
```

## 📝 代码规范

### Python 代码规范

我们遵循 PEP 8 标准，并使用以下工具：

```bash
# 安装开发工具
pip install black flake8 isort mypy

# 代码格式化
black .
isort .

# 代码检查
flake8 .
mypy .
```

**代码风格要点：**
- 使用 4 个空格缩进
- 行长度限制为 88 字符
- 使用有意义的变量和函数名
- 添加适当的类型注解
- 编写清晰的文档字符串

**示例：**
```python
from typing import List, Optional
from django.db import models

class NewsArticle(models.Model):
    """新闻文章模型
    
    Attributes:
        title: 文章标题
        content: 文章内容
        published_at: 发布时间
    """
    title: str = models.CharField(max_length=200, help_text="文章标题")
    content: str = models.TextField(help_text="文章内容")
    published_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    
    def get_summary(self, max_length: int = 100) -> str:
        """获取文章摘要
        
        Args:
            max_length: 摘要最大长度
            
        Returns:
            文章摘要字符串
        """
        if len(self.content) <= max_length:
            return self.content
        return f"{self.content[:max_length]}..."
```

### JavaScript/TypeScript 代码规范

我们使用 ESLint 和 Prettier 进行代码规范化：

```bash
# 安装开发工具
npm install --save-dev eslint prettier @typescript-eslint/parser

# 代码格式化
npm run format

# 代码检查
npm run lint
```

**代码风格要点：**
- 使用 2 个空格缩进
- 使用分号结尾
- 优先使用 const，其次 let
- 使用 TypeScript 类型注解
- 组件使用 PascalCase 命名

**示例：**
```typescript
import React, { useState, useEffect } from 'react';
import { Button, Card, Typography } from 'antd';

interface NewsItemProps {
  id: number;
  title: string;
  content: string;
  publishedAt: string;
}

const NewsItem: React.FC<NewsItemProps> = ({ 
  id, 
  title, 
  content, 
  publishedAt 
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  
  const handleToggleExpand = (): void => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <Card title={title} extra={publishedAt}>
      <Typography.Paragraph ellipsis={!isExpanded}>
        {content}
      </Typography.Paragraph>
      <Button onClick={handleToggleExpand}>
        {isExpanded ? '收起' : '展开'}
      </Button>
    </Card>
  );
};

export default NewsItem;
```

## 📋 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交消息格式

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型说明

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 作用域说明

- `backend`: 后端相关
- `frontend`: 前端相关
- `agent`: AI代理相关
- `docs`: 文档相关
- `docker`: Docker配置相关

### 提交示例

```bash
feat(backend): add RSS source management API
fix(frontend): resolve chat streaming display issue
docs(readme): update installation instructions
style(backend): format code with black
refactor(agent): optimize news fetching logic
perf(frontend): improve component rendering performance
test(backend): add unit tests for news models
chore(docker): update docker-compose configuration
```

## 🔄 Pull Request 流程

### 1. 准备工作

- 确保你的 fork 是最新的
- 创建一个描述性的分支名

```bash
git checkout main
git pull upstream main
git checkout -b feature/add-news-analytics
```

### 2. 开发过程

- 遵循代码规范
- 编写或更新测试
- 确保所有测试通过
- 更新相关文档

```bash
# 运行测试
cd backend && python manage.py test
cd frontend && npm test

# 检查代码规范
black . && flake8 .
npm run lint
```

### 3. 提交更改

```bash
git add .
git commit -m "feat(analytics): add news reading analytics dashboard"
git push origin feature/add-news-analytics
```

### 4. 创建 Pull Request

在 GitHub 上创建 PR 时，请：

- 使用清晰的标题和描述
- 引用相关的 Issue
- 添加适当的标签
- 请求代码审查

**PR 模板：**
```markdown
## 变更描述
简要描述这个PR的目的和实现的功能。

## 变更类型
- [ ] Bug修复
- [ ] 新功能
- [ ] 代码重构
- [ ] 文档更新
- [ ] 其他

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 相关Issue
Closes #123

## 截图（如适用）
添加相关截图展示变更效果。

## 检查清单
- [ ] 代码遵循项目规范
- [ ] 自我审查了代码
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 没有引入新的警告
```

### 5. 代码审查

- 积极响应审查意见
- 及时修复发现的问题
- 保持友好的沟通态度

## 🐛 问题报告

### 报告 Bug

使用 GitHub Issues 报告 Bug，请包含：

1. **Bug 描述**：清晰简洁的描述
2. **复现步骤**：详细的操作步骤
3. **预期行为**：应该发生什么
4. **实际行为**：实际发生了什么
5. **环境信息**：操作系统、浏览器、版本等
6. **截图/日志**：相关的错误信息

**Bug 报告模板：**
```markdown
## Bug 描述
简要描述遇到的问题。

## 复现步骤
1. 进入 '...'
2. 点击 '....'
3. 滚动到 '....'
4. 看到错误

## 预期行为
清晰简洁地描述你期望发生什么。

## 实际行为
清晰简洁地描述实际发生了什么。

## 截图
如果适用，添加截图来帮助解释你的问题。

## 环境信息
- 操作系统: [e.g. macOS 12.0]
- 浏览器: [e.g. Chrome 95.0]
- 项目版本: [e.g. v1.0.0]

## 附加信息
添加任何其他关于问题的信息。
```

## 💡 功能请求

### 提出新功能

使用 GitHub Issues 提出功能请求，请包含：

1. **功能描述**：详细描述建议的功能
2. **使用场景**：解释为什么需要这个功能
3. **解决方案**：描述你希望的实现方式
4. **替代方案**：考虑过的其他解决方案
5. **附加信息**：任何其他相关信息

**功能请求模板：**
```markdown
## 功能描述
清晰简洁地描述你想要的功能。

## 使用场景
描述这个功能解决的问题或改进的体验。

## 建议的解决方案
描述你希望的实现方式。

## 替代方案
描述你考虑过的其他解决方案。

## 附加信息
添加任何其他关于功能请求的信息、截图或示例。
```

## 🏷️ 标签系统

我们使用以下标签来分类 Issues 和 PRs：

### 类型标签
- `bug`: Bug报告
- `enhancement`: 功能增强
- `feature`: 新功能
- `documentation`: 文档相关
- `question`: 问题咨询

### 优先级标签
- `priority/high`: 高优先级
- `priority/medium`: 中优先级
- `priority/low`: 低优先级

### 状态标签
- `status/in-progress`: 进行中
- `status/needs-review`: 需要审查
- `status/blocked`: 被阻塞
- `status/ready`: 准备就绪

### 组件标签
- `component/backend`: 后端相关
- `component/frontend`: 前端相关
- `component/agent`: AI代理相关
- `component/docs`: 文档相关

## 🎯 开发最佳实践

### 1. 分支管理

- `main`: 主分支，保持稳定
- `develop`: 开发分支，集成新功能
- `feature/*`: 功能分支
- `hotfix/*`: 紧急修复分支
- `release/*`: 发布分支

### 2. 测试策略

**后端测试**
```bash
# 运行所有测试
python manage.py test

# 运行特定应用测试
python manage.py test news

# 生成覆盖率报告
coverage run --source='.' manage.py test
coverage report
```

**前端测试**
```bash
# 运行单元测试
npm test

# 运行端到端测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage
```

### 3. 性能考虑

- 数据库查询优化
- 前端组件懒加载
- API响应缓存
- 图片压缩优化

### 4. 安全最佳实践

- 输入验证和清理
- SQL注入防护
- XSS攻击防护
- CSRF保护
- 敏感信息加密

## 📞 获取帮助

如果你在贡献过程中遇到问题，可以通过以下方式获取帮助：

1. **GitHub Issues**: 提出问题或建议
2. **GitHub Discussions**: 参与社区讨论
3. **邮件联系**: [your-email@example.com]
4. **微信群**: 扫描二维码加入开发者群

## 🙏 致谢

感谢所有为项目做出贡献的开发者！你们的努力让这个项目变得更好。

### 贡献者列表

<!-- 这里会自动生成贡献者列表 -->

---

再次感谢你的贡献！让我们一起构建更好的 AI Daily News 系统！