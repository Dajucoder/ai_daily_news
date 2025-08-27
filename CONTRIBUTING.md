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
- [开发最佳实践](#开发最佳实践)
- [获取帮助](#获取帮助)

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
   - 测试用例编写

2. **文档贡献**
   - API文档完善
   - 使用指南编写
   - 代码注释改进
   - 翻译工作
   - 开发文档更新

3. **测试贡献**
   - 单元测试编写
   - 集成测试完善
   - 性能测试
   - 用户体验测试
   - 端到端测试

4. **其他贡献**
   - 问题报告
   - 功能建议
   - 设计改进
   - 社区支持
   - 性能优化建议

## 🛠️ 开发环境设置

### 前置要求

- Python 3.12+
- Node.js 18+
- Git 2.30+
- Docker 20.0+ & Docker Compose 2.0
- PostgreSQL 15+ (可选，开发环境可使用SQLite)
- Redis 7.0+ (可选，用于缓存和任务队列)

### 环境搭建

1. **Fork 并克隆项目**
```bash
git clone https://github.com/your-username/ai_daily_news.git
cd ai_daily_news
```

2. **设置开发环境（推荐使用Docker）**
```bash
# 复制环境变量
cp .env.example .env
cp ai-news-agent/.env.example ai-news-agent/.env
cp frontend/.env.example frontend/.env

# 使用Docker快速启动开发环境
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 等待服务启动完成
docker-compose ps
```

3. **手动环境设置**

**后端环境**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 数据库迁移
python manage.py migrate
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver 0.0.0.0:8000
```

**前端环境**
```bash
cd frontend
npm install

# 启动开发服务器
npm start
```

**AI代理环境**
```bash
cd ai-news-agent
pip install -r requirements.txt

# 启动AI代理服务
python start.py
```

### 开发服务启动

```bash
# 使用Docker启动所有服务
docker-compose -f docker-compose.dev.yml up -d

# 查看服务状态
docker-compose ps

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f ai-news-agent

# 停止所有服务
docker-compose down
```

### 数据库设置

**SQLite (开发环境)**
```bash
# 默认使用SQLite，无需额外配置
python manage.py migrate
```

**PostgreSQL (生产环境)**
```bash
# 安装PostgreSQL
# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql

# 创建数据库
sudo -u postgres createdb ai_news
sudo -u postgres createuser --interactive

# 更新环境变量
DATABASE_URL=postgresql://username:password@localhost:5432/ai_news
```

## 📝 代码规范

### Python 代码规范

我们遵循 PEP 8 标准，并使用以下工具：

```bash
# 安装开发工具
pip install black flake8 isort mypy pre-commit

# 配置pre-commit钩子
pre-commit install

# 代码格式化
black .
isort .

# 代码检查
flake8 .
mypy .

# 运行所有检查
pre-commit run --all-files
```

**代码风格要点：**
- 使用 4 个空格缩进
- 行长度限制为 88 字符
- 使用有意义的变量和函数名
- 添加适当的类型注解
- 编写清晰的文档字符串
- 遵循Django最佳实践

**示例：**
```python
from typing import List, Optional, Dict, Any
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError

class NewsArticle(models.Model):
    """新闻文章模型
    
    用于存储从RSS源获取的新闻文章信息。
    
    Attributes:
        title: 文章标题，最大长度200字符
        content: 文章内容，支持HTML格式
        published_at: 发布时间，自动设置为创建时间
        source: 新闻来源
        category: 新闻分类
        is_active: 是否激活状态
    """
    
    title: str = models.CharField(
        max_length=200, 
        help_text="文章标题",
        db_index=True
    )
    content: str = models.TextField(help_text="文章内容")
    published_at: models.DateTimeField = models.DateTimeField(
        default=timezone.now,
        help_text="发布时间"
    )
    source: str = models.CharField(
        max_length=100,
        help_text="新闻来源"
    )
    category: str = models.CharField(
        max_length=50,
        choices=[
            ('technology', '技术'),
            ('business', '商业'),
            ('politics', '政治'),
            ('sports', '体育'),
        ],
        default='technology'
    )
    is_active: bool = models.BooleanField(
        default=True,
        help_text="是否激活状态"
    )
    
    class Meta:
        """模型元数据"""
        db_table = 'news_articles'
        ordering = ['-published_at']
        indexes = [
            models.Index(fields=['category', 'published_at']),
            models.Index(fields=['source', 'published_at']),
        ]
        verbose_name = '新闻文章'
        verbose_name_plural = '新闻文章'
    
    def __str__(self) -> str:
        """返回模型的字符串表示"""
        return f"{self.title} - {self.source}"
    
    def get_summary(self, max_length: int = 100) -> str:
        """获取文章摘要
        
        Args:
            max_length: 摘要最大长度，默认100字符
            
        Returns:
            文章摘要字符串
            
        Raises:
            ValueError: 当max_length小于等于0时
        """
        if max_length <= 0:
            raise ValueError("max_length必须大于0")
            
        if len(self.content) <= max_length:
            return self.content
        return f"{self.content[:max_length]}..."
    
    def clean(self) -> None:
        """模型验证"""
        if len(self.title.strip()) == 0:
            raise ValidationError("标题不能为空")
        
        if len(self.content.strip()) == 0:
            raise ValidationError("内容不能为空")
    
    def save(self, *args: Any, **kwargs: Any) -> None:
        """保存前的处理"""
        self.clean()
        super().save(*args, **kwargs)
```

### JavaScript/TypeScript 代码规范

我们使用 ESLint、Prettier 和 TypeScript 进行代码规范化：

```bash
# 安装开发工具
npm install --save-dev eslint prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin

# 代码格式化
npm run format

# 代码检查
npm run lint

# 类型检查
npm run type-check
```

**代码风格要点：**
- 使用 2 个空格缩进
- 使用分号结尾
- 优先使用 const，其次 let
- 使用 TypeScript 类型注解
- 组件使用 PascalCase 命名
- 使用函数式组件和Hooks
- 遵循React最佳实践

**示例：**
```typescript
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button, Card, Typography, Tag, Space, Tooltip } from 'antd';
import { EyeOutlined, LikeOutlined, ShareAltOutlined } from '@ant-design/icons';
import type { NewsItem, Category } from '@/types';

interface NewsItemProps {
  /** 新闻项目数据 */
  news: NewsItem;
  /** 是否显示完整内容 */
  showFullContent?: boolean;
  /** 点击事件回调 */
  onItemClick?: (news: NewsItem) => void;
  /** 点赞事件回调 */
  onLike?: (newsId: number) => void;
  /** 分享事件回调 */
  onShare?: (news: NewsItem) => void;
}

const NewsItem: React.FC<NewsItemProps> = ({ 
  news, 
  showFullContent = false,
  onItemClick,
  onLike,
  onShare
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(news.likeCount || 0);
  
  // 处理展开/收起
  const handleToggleExpand = useCallback((): void => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);
  
  // 处理点赞
  const handleLike = useCallback((): void => {
    if (onLike) {
      onLike(news.id);
      setLikeCount(prev => prev + 1);
    }
  }, [news.id, onLike]);
  
  // 处理分享
  const handleShare = useCallback((): void => {
    if (onShare) {
      onShare(news);
    }
  }, [news, onShare]);
  
  // 处理点击
  const handleClick = useCallback((): void => {
    if (onItemClick) {
      onItemClick(news);
    }
  }, [news, onItemClick]);
  
  // 计算显示内容
  const displayContent = useMemo((): string => {
    if (showFullContent || isExpanded) {
      return news.content;
    }
    return news.content.length > 200 
      ? `${news.content.substring(0, 200)}...` 
      : news.content;
  }, [news.content, showFullContent, isExpanded]);
  
  // 格式化发布时间
  const formattedTime = useMemo((): string => {
    const date = new Date(news.publishedAt);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [news.publishedAt]);
  
  return (
    <Card 
      hoverable
      className="news-item-card"
      onClick={handleClick}
    >
      <div className="news-header">
        <Typography.Title level={4} className="news-title">
          {news.title}
        </Typography.Title>
        <Space size="small">
          <Tag color="blue">{news.category}</Tag>
          <Typography.Text type="secondary" className="news-time">
            {formattedTime}
          </Typography.Text>
        </Space>
      </div>
      
      <div className="news-content">
        <Typography.Paragraph 
          ellipsis={!showFullContent && !isExpanded}
          className="news-text"
        >
          {displayContent}
        </Typography.Paragraph>
        
        {!showFullContent && news.content.length > 200 && (
          <Button 
            type="link" 
            onClick={handleToggleExpand}
            className="expand-button"
          >
            {isExpanded ? '收起' : '展开'}
          </Button>
        )}
      </div>
      
      <div className="news-footer">
        <Space size="middle">
          <Tooltip title="查看">
            <Button 
              type="text" 
              icon={<EyeOutlined />}
              className="action-button"
            />
          </Tooltip>
          
          <Tooltip title="点赞">
            <Button 
              type="text" 
              icon={<LikeOutlined />}
              onClick={handleLike}
              className="action-button"
            >
              {likeCount}
            </Button>
          </Tooltip>
          
          <Tooltip title="分享">
            <Button 
              type="text" 
              icon={<ShareAltOutlined />}
              onClick={handleShare}
              className="action-button"
            />
          </Tooltip>
        </Space>
        
        <Typography.Text type="secondary" className="news-source">
          来源: {news.source}
        </Typography.Text>
      </div>
    </Card>
  );
};

export default NewsItem;
```

### Django 特定规范

**模型设计**
```python
# 使用有意义的字段名和关系
class RSSSource(models.Model):
    name = models.CharField(max_length=100, verbose_name="源名称")
    url = models.URLField(verbose_name="RSS地址")
    category = models.CharField(max_length=50, verbose_name="分类")
    is_active = models.BooleanField(default=True, verbose_name="是否激活")
    last_fetch = models.DateTimeField(null=True, blank=True, verbose_name="最后获取时间")
    
    class Meta:
        verbose_name = "RSS源"
        verbose_name_plural = "RSS源"
        ordering = ['name']
        unique_together = ['url', 'category']
    
    def __str__(self):
        return f"{self.name} ({self.category})"
    
    def clean(self):
        """验证RSS源"""
        if not self.url.startswith(('http://', 'https://')):
            raise ValidationError("URL必须以http://或https://开头")
    
    def get_fetch_status(self):
        """获取获取状态"""
        if not self.last_fetch:
            return "从未获取"
        
        time_diff = timezone.now() - self.last_fetch
        if time_diff.days > 1:
            return "需要更新"
        return "正常"
```

**视图设计**
```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters import rest_framework as filters

class NewsViewSet(viewsets.ModelViewSet):
    """新闻视图集"""
    queryset = NewsArticle.objects.filter(is_active=True)
    serializer_class = NewsArticleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.DjangoFilterBackend]
    filterset_fields = ['category', 'source', 'published_at']
    
    @action(detail=False, methods=['post'])
    def fetch_latest(self, request):
        """手动获取最新新闻"""
        try:
            # 执行新闻获取逻辑
            fetched_count = self.perform_fetch()
            return Response({
                'message': f'成功获取 {fetched_count} 条新闻',
                'fetched_count': fetched_count
            })
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def perform_fetch(self):
        """执行新闻获取"""
        # 实现获取逻辑
        pass
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
- `ci`: CI/CD相关
- `build`: 构建系统相关

### 作用域说明

- `backend`: 后端相关
- `frontend`: 前端相关
- `agent`: AI代理相关
- `docs`: 文档相关
- `docker`: Docker配置相关
- `api`: API相关
- `ui`: 用户界面相关
- `db`: 数据库相关

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
ci(github): add automated testing workflow
build(frontend): upgrade to Vite 5.0
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

# 类型检查
mypy .
npm run type-check
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
- [ ] 性能优化
- [ ] 测试相关
- [ ] 其他

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成
- [ ] 代码规范检查通过

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
- [ ] 所有测试通过
- [ ] 代码格式化完成
```

### 5. 代码审查

- 积极响应审查意见
- 及时修复发现的问题
- 保持友好的沟通态度
- 遵循审查反馈进行改进

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
- Python版本: [e.g. 3.12.0]
- Node.js版本: [e.g. 18.0.0]

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
- `performance`: 性能相关
- `security`: 安全相关

### 优先级标签
- `priority/high`: 高优先级
- `priority/medium`: 中优先级
- `priority/low`: 低优先级

### 状态标签
- `status/in-progress`: 进行中
- `status/needs-review`: 需要审查
- `status/blocked`: 被阻塞
- `status/ready`: 准备就绪
- `status/testing`: 测试中

### 组件标签
- `component/backend`: 后端相关
- `component/frontend`: 前端相关
- `component/agent`: AI代理相关
- `component/docs`: 文档相关
- `component/api`: API相关
- `component/ui`: 用户界面相关

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
coverage html  # 生成HTML报告

# 运行性能测试
python manage.py test --settings=ai_news_backend.settings.test
```

**前端测试**
```bash
# 运行单元测试
npm test

# 运行端到端测试
npm run test:e2e

# 生成覆盖率报告
npm run test:coverage

# 运行类型检查
npm run type-check
```

### 3. 性能考虑

- 数据库查询优化
- 前端组件懒加载
- API响应缓存
- 图片压缩优化
- 代码分割和Tree Shaking

### 4. 安全最佳实践

- 输入验证和清理
- SQL注入防护
- XSS攻击防护
- CSRF保护
- 敏感信息加密
- 权限控制
- API限流

### 5. 代码质量保证

```bash
# 安装pre-commit钩子
pip install pre-commit
pre-commit install

# 运行所有检查
pre-commit run --all-files

# 自动修复
pre-commit run --all-files --hook-stage manual
```

### 6. 数据库最佳实践

```python
# 使用select_related和prefetch_related优化查询
class NewsViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return NewsArticle.objects.select_related('source').prefetch_related('tags')
    
    # 使用数据库索引
    class Meta:
        indexes = [
            models.Index(fields=['published_at']),
            models.Index(fields=['category', 'published_at']),
        ]
```

### 7. API设计最佳实践

```python
# 使用序列化器验证数据
class NewsArticleSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsArticle
        fields = ['id', 'title', 'content', 'published_at', 'source', 'category']
        read_only_fields = ['id', 'published_at']
    
    def validate_title(self, value):
        if len(value.strip()) < 5:
            raise serializers.ValidationError("标题至少需要5个字符")
        return value

# 使用分页
class NewsViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination
    page_size = 20
    max_page_size = 100
```

## 📞 获取帮助

如果你在贡献过程中遇到问题，可以通过以下方式获取帮助：

1. **GitHub Issues**: 提出问题或建议
2. **GitHub Discussions**: 参与社区讨论
3. **邮件联系**: [your-email@example.com]
4. **微信群**: 扫描二维码加入开发者群
5. **项目文档**: 查看 [docs/](docs/) 目录下的详细文档

## 🙏 致谢

感谢所有为项目做出贡献的开发者！你们的努力让这个项目变得更好。

### 贡献者列表

<!-- 这里会自动生成贡献者列表 -->

---

再次感谢你的贡献！让我们一起构建更好的 AI Daily News 系统！