# 开发指南

本文档为 AI Daily News 项目的开发者提供详细的开发指导和最佳实践。

## 📋 目录

- [项目架构](#项目架构)
- [开发环境](#开发环境)
- [代码结构](#代码结构)
- [开发流程](#开发流程)
- [调试指南](#调试指南)
- [性能优化](#性能优化)

## 🏗️ 项目架构

### 整体架构

```
AI Daily News System
├── Frontend (React + TypeScript)
│   ├── 用户界面层
│   ├── 状态管理层
│   └── 服务通信层
├── Backend (Django + DRF)
│   ├── API接口层
│   ├── 业务逻辑层
│   ├── 数据访问层
│   └── 认证授权层
├── AI Agent (Flask + OpenAI)
│   ├── RSS数据获取
│   ├── AI内容处理
│   └── 任务调度管理
└── Database (PostgreSQL/SQLite)
    ├── 用户数据
    ├── 新闻数据
    └── 配置数据
```

### 技术选型理由

**后端选择 Django**
- 成熟的Web框架，开发效率高
- 强大的ORM系统，数据库操作便捷
- 丰富的第三方库生态
- 内置管理后台，便于数据管理

**前端选择 React + TypeScript**
- 组件化开发，代码复用性强
- TypeScript提供类型安全
- 丰富的UI组件库支持
- 活跃的社区和生态

**AI代理独立服务**
- 解耦AI处理逻辑
- 便于扩展和维护
- 支持独立部署和扩容
- 降低主服务的复杂度

## 🛠️ 开发环境

### 环境配置

#### 1. Python环境管理

推荐使用 `pyenv` 管理Python版本：

```bash
# 安装pyenv
curl https://pyenv.run | bash

# 安装Python 3.8+
pyenv install 3.8.10
pyenv global 3.8.10

# 创建虚拟环境
python -m venv ai_news_env
source ai_news_env/bin/activate
```

#### 2. Node.js环境管理

推荐使用 `nvm` 管理Node.js版本：

```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装Node.js 16+
nvm install 16
nvm use 16
```

### 开发工具配置

#### VS Code 推荐插件

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode-remote.remote-containers"
  ]
}
```

#### Git Hooks 配置

```bash
# 安装pre-commit
pip install pre-commit

# 配置pre-commit hooks
pre-commit install
```

## 📁 代码结构

### 后端结构 (Django)

```
backend/
├── ai_news_backend/          # 项目配置
│   ├── settings.py          # Django设置
│   ├── urls.py              # 主URL配置
│   └── wsgi.py              # WSGI配置
├── accounts/                # 用户管理应用
│   ├── models.py            # 用户模型
│   ├── serializers.py       # API序列化器
│   ├── views.py             # API视图
│   └── urls.py              # URL路由
├── news/                    # 新闻管理应用
│   ├── models.py            # 新闻模型
│   ├── services.py          # 业务逻辑
│   ├── views.py             # API视图
│   └── pagination.py        # 分页配置
├── chat/                    # 聊天功能应用
│   ├── models.py            # 聊天模型
│   ├── services.py          # AI服务集成
│   └── views.py             # 聊天API
└── manage.py                # Django管理脚本
```

### 前端结构 (React)

```
frontend/src/
├── components/              # React组件
│   ├── Chat.tsx            # 聊天组件
│   ├── NewsList.tsx        # 新闻列表
│   ├── Dashboard.tsx       # 仪表板
│   └── Login.tsx           # 登录组件
├── contexts/               # React Context
│   └── AuthContext.tsx     # 认证上下文
├── services/               # API服务
│   ├── api.ts              # 基础API配置
│   ├── authService.ts      # 认证服务
│   ├── newsService.ts      # 新闻服务
│   └── chatService.ts      # 聊天服务
├── types/                  # TypeScript类型定义
│   └── index.ts            # 通用类型
├── App.tsx                 # 主应用组件
└── index.tsx               # 应用入口
```

### AI代理结构 (Flask)

```
ai-news-agent/
├── config.py               # 配置文件
├── rss_fetcher.py          # RSS抓取器
├── ai_processor.py         # AI内容处理
├── news_agent.py           # 主程序
├── api_server.py           # Flask API服务
├── start.py                # 启动脚本
└── output/                 # 输出目录
```

## 🔄 开发流程

### 1. 功能开发流程

```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发功能
# 编写代码...

# 3. 运行测试
cd backend && python manage.py test
cd frontend && npm test

# 4. 代码检查
black . && flake8 .
npm run lint

# 5. 提交代码
git add .
git commit -m "feat: add new feature"

# 6. 推送分支
git push origin feature/new-feature

# 7. 创建Pull Request
```

### 2. 数据库迁移流程

```bash
# 创建迁移文件
python manage.py makemigrations

# 查看迁移SQL
python manage.py sqlmigrate app_name migration_name

# 应用迁移
python manage.py migrate

# 回滚迁移
python manage.py migrate app_name previous_migration
```

### 3. API开发流程

#### 后端API开发

```python
# 1. 定义模型 (models.py)
class NewsItem(models.Model):
    title = models.CharField(max_length=200)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

# 2. 创建序列化器 (serializers.py)
class NewsItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsItem
        fields = '__all__'

# 3. 实现视图 (views.py)
class NewsItemViewSet(viewsets.ModelViewSet):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer
    permission_classes = [IsAuthenticated]

# 4. 配置URL (urls.py)
router.register(r'news', NewsItemViewSet)
```

#### 前端API集成

```typescript
// 1. 定义类型 (types/index.ts)
interface NewsItem {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

// 2. 创建服务 (services/newsService.ts)
export const newsService = {
  async getNews(): Promise<NewsItem[]> {
    const response = await api.get('/news/');
    return response.data.results;
  },
  
  async createNews(data: Partial<NewsItem>): Promise<NewsItem> {
    const response = await api.post('/news/', data);
    return response.data;
  }
};

// 3. 在组件中使用
const NewsList: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  
  useEffect(() => {
    newsService.getNews().then(setNews);
  }, []);
  
  return (
    <div>
      {news.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
};
```

## 🐛 调试指南

### 后端调试

#### 1. Django调试工具

```python
# settings.py - 开发环境配置
DEBUG = True
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

# 使用Django shell调试
python manage.py shell
>>> from news.models import NewsItem
>>> NewsItem.objects.all()
```

#### 2. 日志配置

```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

### 前端调试

#### 1. React DevTools

```bash
# 安装React DevTools浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
```

#### 2. 调试技巧

```typescript
// 使用console.log调试
console.log('Debug info:', data);

// 使用debugger断点
debugger;

// 使用React.StrictMode检测问题
<React.StrictMode>
  <App />
</React.StrictMode>
```

### AI代理调试

```python
# 启用详细日志
import logging
logging.basicConfig(level=logging.DEBUG)

# 测试API连接
python test_ai_connection.py

# 查看处理日志
tail -f rss_fetcher.log
```

## ⚡ 性能优化

### 后端优化

#### 1. 数据库优化

```python
# 使用select_related减少查询
NewsItem.objects.select_related('author').all()

# 使用prefetch_related优化多对多关系
NewsItem.objects.prefetch_related('tags').all()

# 添加数据库索引
class NewsItem(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['created_at', 'category']),
        ]
```

#### 2. 缓存策略

```python
# Redis缓存配置
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 使用缓存装饰器
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # 缓存15分钟
def news_list(request):
    return JsonResponse(data)
```

### 前端优化

#### 1. 组件优化

```typescript
// 使用React.memo避免不必要的重渲染
const NewsItem = React.memo<NewsItemProps>(({ item }) => {
  return <div>{item.title}</div>;
});

// 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// 使用useCallback缓存函数
const handleClick = useCallback(() => {
  onClick(id);
}, [id, onClick]);
```

#### 2. 代码分割

```typescript
// 路由级别的代码分割
const NewsList = lazy(() => import('./components/NewsList'));
const Chat = lazy(() => import('./components/Chat'));

// 使用Suspense包装
<Suspense fallback={<div>Loading...</div>}>
  <Routes>
    <Route path="/news" element={<NewsList />} />
    <Route path="/chat" element={<Chat />} />
  </Routes>
</Suspense>
```

### AI代理优化

```python
# 异步处理
import asyncio
import aiohttp

async def fetch_rss_async(urls):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_url(session, url) for url in urls]
        return await asyncio.gather(*tasks)

# 批量处理
def process_articles_batch(articles, batch_size=10):
    for i in range(0, len(articles), batch_size):
        batch = articles[i:i + batch_size]
        yield process_batch(batch)
```

## 🔒 安全最佳实践

### 1. 认证和授权

```python
# JWT配置
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# 权限检查
class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user
```

### 2. 输入验证

```python
# 使用Django表单验证
class NewsForm(forms.ModelForm):
    class Meta:
        model = NewsItem
        fields = ['title', 'content']
    
    def clean_title(self):
        title = self.cleaned_data['title']
        if len(title) < 5:
            raise forms.ValidationError('标题太短')
        return title
```

### 3. SQL注入防护

```python
# 使用ORM查询（推荐）
NewsItem.objects.filter(title__icontains=search_term)

# 如需原生SQL，使用参数化查询
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT * FROM news WHERE title LIKE %s", [f'%{search_term}%'])
```

## 📊 监控和日志

### 1. 应用监控

```python
# 使用Django-prometheus监控
INSTALLED_APPS += ['django_prometheus']
MIDDLEWARE = ['django_prometheus.middleware.PrometheusBeforeMiddleware'] + MIDDLEWARE
MIDDLEWARE += ['django_prometheus.middleware.PrometheusAfterMiddleware']
```

### 2. 错误追踪

```python
# 集成Sentry
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn="YOUR_SENTRY_DSN",
    integrations=[DjangoIntegration()],
    traces_sample_rate=1.0,
)
```

### 3. 性能监控

```typescript
// 前端性能监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

这份开发指南涵盖了项目开发的各个方面，帮助开发者快速上手并遵循最佳实践。如有疑问，请参考项目文档或联系维护团队。