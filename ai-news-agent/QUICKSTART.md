# AI新闻代理快速启动指南

## 🚀 快速开始

### 1. 环境准备

```bash
# 进入ai-news-agent目录
cd ai-news-agent

# 虚拟环境已创建，激活即可
source venv/bin/activate  # macOS/Linux
# 或者 Windows: venv\Scripts\activate

# 依赖已安装，可直接使用
```

### 2. 配置API密钥

```bash
# 设置硅基流动API密钥
export SILICONFLOW_API_KEY="your_api_key_here"

# 或者创建 .env 文件
cp env_example.txt .env
# 然后编辑 .env 文件填入真实的API密钥
```

### 3. 启动服务

#### 方式一：使用启动脚本（推荐）
```bash
python start.py
# 选择 2 启动API服务器
```

#### 方式二：直接启动
```bash
# 启动API服务器
python api_server.py

# 或者直接抓取新闻
python news_agent.py
```

### 4. 验证服务

访问 http://localhost:5001/api/health 检查服务状态

### 5. 与Django后端集成

1. 确保AI新闻代理服务运行在端口5001
2. 启动Django后端服务 (端口8000)
3. 在Django管理界面中点击"获取新闻"

## 📁 文件说明

- `config.py` - 配置文件（RSS源、模型配置等）
- `rss_fetcher.py` - RSS抓取器
- `ai_processor.py` - AI内容处理器  
- `news_agent.py` - 主程序
- `api_server.py` - API服务器
- `start.py` - 启动脚本
- `output/` - 输出目录（自动创建）

## 🔧 常见问题

1. **API密钥错误**：确保SILICONFLOW_API_KEY正确设置
2. **网络连接**：确保能访问RSS源和API服务
3. **端口占用**：如果5001端口被占用，修改api_server.py中的端口号
4. **权限问题**：确保output目录有写入权限

## 📋 支持的RSS源

- Hugging Face博客
- ArXiv AI论文  
- Reddit机器学习
- MIT Tech Review AI
- The Batch (Andrew Ng)

可在config.py中添加更多RSS源。
