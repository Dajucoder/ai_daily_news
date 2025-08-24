# AI Daily News 前端应用

AI Daily News平台的前端应用，使用React 18 + TypeScript + Ant Design构建的现代化Web界面。

## 🚀 功能特性

- **📱 响应式设计**: 适配桌面端和移动端
- **🎨 现代化UI**: 基于Ant Design设计系统
- **⚡ 高性能**: React 18新特性，优化渲染性能
- **🔒 用户认证**: JWT身份认证和权限管理
- **📊 数据可视化**: 新闻统计和趋势图表
- **🔍 智能搜索**: 多维度新闻搜索和筛选
- **📰 新闻管理**: 新闻列表、详情和分类浏览
- **⚙️ 系统设置**: 用户偏好和系统配置

## 🛠️ 技术栈

- **React**: 18.3.1 - 前端框架
- **TypeScript**: 4.9.5 - 类型系统
- **Ant Design**: 5.27.1 - UI组件库
- **React Router**: 7.8.2 - 路由管理
- **Axios**: 1.11.0 - HTTP客户端
- **Day.js**: 1.11.13 - 时间处理
- **React Scripts**: 5.0.1 - 构建工具

## 📂 项目结构

```
frontend/
├── public/                 # 静态资源
│   ├── index.html         # HTML模板
│   └── favicon.ico        # 网站图标
├── src/                   # 源代码
│   ├── components/        # React组件
│   │   ├── Dashboard.tsx      # 仪表板
│   │   ├── Login.tsx          # 登录页面
│   │   ├── NewsList.tsx       # 新闻列表
│   │   ├── NewsAnalytics.tsx  # 新闻分析
│   │   ├── FetchHistory.tsx   # 抓取历史
│   │   ├── UserProfile.tsx    # 用户资料
│   │   └── SystemSettings.tsx # 系统设置
│   ├── contexts/          # React Context
│   │   └── AuthContext.tsx    # 认证上下文
│   ├── services/          # API服务
│   │   ├── api.ts             # API基础配置
│   │   ├── authService.ts     # 认证服务
│   │   ├── newsService.ts     # 新闻服务
│   │   └── agentService.ts    # AI代理服务
│   ├── types/             # TypeScript类型定义
│   │   └── index.ts           # 通用类型
│   ├── App.tsx            # 主应用组件
│   ├── index.tsx          # 应用入口
│   └── index.css          # 全局样式
├── package.json           # 依赖配置
└── tsconfig.json          # TypeScript配置
```

## 🚀 快速开始

### 环境要求

- Node.js 16+ (推荐18.x LTS)
- npm 8+ 或 yarn 1.22+

### 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm start

# 应用将在 http://localhost:3000 启动
```

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 构建文件将生成在 build/ 目录下
```

### 运行测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm test -- --coverage
```

## ⚙️ 配置说明

### API代理配置

项目使用package.json中的proxy配置自动代理API请求：

```json
{
  "proxy": "http://localhost:8000"
}
```

这意味着所有以`/api`开头的请求都会被代理到后端服务器。

### 环境变量

可以在项目根目录创建`.env`文件来配置环境变量：

```env
# API基础URL（可选，默认使用proxy）
REACT_APP_API_URL=http://localhost:8000/api

# AI代理API URL
REACT_APP_AI_AGENT_URL=http://localhost:5001/api

# 应用标题
REACT_APP_TITLE=AI Daily News

# 是否启用开发模式功能
REACT_APP_DEV_MODE=true
```

## 🎨 UI组件说明

### 主要页面组件

**Dashboard.tsx** - 仪表板页面
- 新闻统计概览
- 快速操作按钮
- 最新新闻预览

**NewsList.tsx** - 新闻列表页面
- 分页新闻列表
- 搜索和筛选功能
- 新闻卡片展示

**NewsAnalytics.tsx** - 新闻分析页面
- 数据可视化图表
- 统计指标展示
- 趋势分析

**Login.tsx** - 登录页面
- 用户登录表单
- JWT认证处理
- 登录状态管理

### 服务层

**authService.ts** - 认证服务
```typescript
// 主要功能
- login(username, password)     // 用户登录
- logout()                      // 用户登出
- refreshToken()                // 刷新令牌
- getCurrentUser()              // 获取当前用户
```

**newsService.ts** - 新闻服务
```typescript
// 主要功能
- getNews(params)               // 获取新闻列表
- getNewsById(id)               // 获取新闻详情
- fetchNews(date)               // 触发新闻抓取
- getAnalytics()                // 获取统计数据
```

**agentService.ts** - AI代理服务
```typescript
// 主要功能
- getHealth()                   // 健康检查
- getSources()                  // 获取RSS源
- fetchNews(params)             // 启动抓取任务
- getLatestReport()             // 获取最新报告
```

## 🎯 开发指南

### 添加新页面

1. 在`src/components/`目录下创建新组件
2. 在`App.tsx`中添加路由配置
3. 如需要，在`src/types/index.ts`中添加类型定义

```typescript
// 示例：创建新页面组件
import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const NewPage: React.FC = () => {
  return (
    <Card>
      <Title level={2}>新页面</Title>
      <p>页面内容...</p>
    </Card>
  );
};

export default NewPage;
```

### 添加新API服务

在`src/services/`目录下创建新的服务文件：

```typescript
// 示例：创建新服务
import api from './api';

export const newService = {
  async getData() {
    const response = await api.get('/new-endpoint/');
    return response.data;
  },
  
  async postData(data: any) {
    const response = await api.post('/new-endpoint/', data);
    return response.data;
  }
};
```

### 状态管理

项目使用React Context进行状态管理，主要包括：

- **AuthContext**: 用户认证状态
- 可根据需要添加其他Context

```typescript
// 使用AuthContext
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  // 组件逻辑...
};
```

## 🔧 调试和测试

### 开发调试

```bash
# 启用详细错误信息
REACT_APP_DEBUG=true npm start

# 分析打包大小
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

### 代码规范

项目使用ESLint和Prettier确保代码质量：

```bash
# 检查代码规范
npx eslint src/

# 自动修复
npx eslint src/ --fix

# 格式化代码
npx prettier --write src/
```

### 性能优化

- 使用React.memo()优化组件渲染
- 使用useMemo()和useCallback()优化计算
- 实现组件懒加载
- 优化图片和静态资源

```typescript
// 组件懒加载示例
const LazyComponent = React.lazy(() => import('./LazyComponent'));

<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

## 📱 移动端适配

项目使用Ant Design的响应式特性，支持多种屏幕尺寸：

- **xs**: < 576px (手机)
- **sm**: ≥ 576px (平板)
- **md**: ≥ 768px (小屏电脑)
- **lg**: ≥ 992px (大屏电脑)
- **xl**: ≥ 1200px (超大屏)

```typescript
// 响应式布局示例
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    内容...
  </Col>
</Row>
```

## 🚀 部署说明

### 开发环境部署

```bash
npm start
```

### 生产环境部署

```bash
# 构建生产版本
npm run build

# 使用静态文件服务器
npx serve -s build

# 或部署到Nginx等Web服务器
```

### Docker部署

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 📚 相关资源

- [React文档](https://reactjs.org/)
- [TypeScript文档](https://www.typescriptlang.org/)
- [Ant Design文档](https://ant.design/)
- [Create React App文档](https://create-react-app.dev/)

## 🔗 相关链接

- [项目主页](../README.md)
- [API文档](../docs/api-documentation.md)
- [部署指南](../docs/deployment-guide.md)
- [故障排除](../docs/troubleshooting.md)
