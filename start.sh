#!/bin/bash

# AI新闻系统启动脚本

echo "==================================="
echo "AI新闻系统启动脚本"
echo "==================================="

# 检查是否存在.env文件
if [ ! -f ".env" ]; then
    echo "❌ 错误: .env文件不存在"
    echo "请复制.env.example为.env并配置相关参数"
    exit 1
fi

# 启动后端服务
echo "🚀 启动Django后端服务..."
cd backend

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📦 安装Python依赖..."
pip install -r requirements.txt

# 运行数据库迁移
echo "🗄️ 运行数据库迁移..."
python manage.py migrate

# 启动Django服务器（后台运行）
echo "🌐 启动Django开发服务器..."
python manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!

# 等待Django服务启动
sleep 3

# 启动前端服务
echo "🎨 启动React前端服务..."
cd ../frontend

# 安装依赖
echo "📦 安装Node.js依赖..."
npm install

# 启动React开发服务器
echo "🌐 启动React开发服务器..."
npm start &
REACT_PID=$!

echo ""
echo "✅ 服务启动完成!"
echo "🔗 前端地址: http://localhost:3000"
echo "🔗 后端地址: http://localhost:8000"
echo "📚 API文档: http://localhost:8000/api/docs/"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $DJANGO_PID $REACT_PID; exit" INT
wait