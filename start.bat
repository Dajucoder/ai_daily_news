@echo off
chcp 65001 >nul

echo ===================================
echo AI新闻系统启动脚本
echo ===================================

REM 检查是否存在.env文件
if not exist ".env" (
    echo ❌ 错误: .env文件不存在
    echo 请复制.env.example为.env并配置相关参数
    pause
    exit /b 1
)

REM 启动后端服务
echo 🚀 启动Django后端服务...
cd backend

REM 检查虚拟环境
if not exist "venv" (
    echo 📦 创建Python虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate

REM 安装依赖
echo 📦 安装Python依赖...
pip install -r requirements.txt

REM 运行数据库迁移
echo 🗄️ 运行数据库迁移...
python manage.py migrate

REM 启动Django服务器（后台运行）
echo 🌐 启动Django开发服务器...
start /b python manage.py runserver 0.0.0.0:8000

REM 等待Django服务启动
timeout /t 3 /nobreak >nul

REM 启动前端服务
echo 🎨 启动React前端服务...
cd ..\frontend

REM 安装依赖
echo 📦 安装Node.js依赖...
call npm install

REM 启动React开发服务器
echo 🌐 启动React开发服务器...
start /b npm start

echo.
echo ✅ 服务启动完成!
echo 🔗 前端地址: http://localhost:3000
echo 🔗 后端地址: http://localhost:8000
echo 📚 API文档: http://localhost:8000/api/docs/
echo.
echo 按任意键退出...
pause >nul