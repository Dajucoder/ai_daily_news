#!/usr/bin/env python3
"""
AI新闻代理启动脚本
"""
import os
import sys
import subprocess
from pathlib import Path


def check_environment():
    """检查环境配置"""
    print("检查环境配置...")
    
    # 检查虚拟环境
    venv_path = Path("venv")
    if not venv_path.exists():
        print("❌ 虚拟环境不存在，请运行: python3 -m venv venv")
        return False
    
    # 检查Python可执行文件
    if sys.platform == "win32":
        python_exe = venv_path / "Scripts" / "python.exe"
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:
        python_exe = venv_path / "bin" / "python"
        pip_exe = venv_path / "bin" / "pip"
    
    if not python_exe.exists():
        print("❌ 虚拟环境中的Python不存在")
        return False
    
    # 检查API Key
    api_key = os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        print("❌ 请设置SILICONFLOW_API_KEY环境变量")
        print("   export SILICONFLOW_API_KEY='your_api_key'")
        return False
    
    print("✅ 环境配置正常")
    return True


def install_dependencies():
    """安装依赖"""
    print("安装依赖包...")
    
    venv_path = Path("venv")
    if sys.platform == "win32":
        pip_exe = venv_path / "Scripts" / "pip.exe"
    else:
        pip_exe = venv_path / "bin" / "pip"
    
    try:
        subprocess.run([str(pip_exe), "install", "-r", "requirements.txt"], check=True)
        print("✅ 依赖安装完成")
        return True
    except subprocess.CalledProcessError:
        print("❌ 依赖安装失败")
        return False


def main():
    """主函数"""
    print("=== AI新闻代理启动器 ===")
    
    if not check_environment():
        print("\n请先配置环境：")
        print("1. 创建虚拟环境: python3 -m venv venv")
        print("2. 设置API Key: export SILICONFLOW_API_KEY='your_api_key'")
        return 1
    
    # 询问运行模式
    print("\n选择运行模式：")
    print("1. 一次性抓取新闻")
    print("2. 启动API服务器")
    print("3. 安装/更新依赖")
    
    choice = input("请选择 (1-3): ").strip()
    
    venv_path = Path("venv")
    if sys.platform == "win32":
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        python_exe = venv_path / "bin" / "python"
    
    if choice == "1":
        # 一次性抓取
        print("\n开始抓取今日AI新闻...")
        try:
            subprocess.run([str(python_exe), "news_agent.py"], check=True)
        except subprocess.CalledProcessError:
            print("❌ 抓取失败")
            return 1
    
    elif choice == "2":
        # 启动API服务器
        print("\n启动API服务器...")
        print("服务器将在 http://localhost:5001 运行")
        print("按 Ctrl+C 停止服务器")
        try:
            subprocess.run([str(python_exe), "api_server.py"], check=True)
        except KeyboardInterrupt:
            print("\n服务器已停止")
        except subprocess.CalledProcessError:
            print("❌ 服务器启动失败")
            return 1
    
    elif choice == "3":
        # 安装依赖
        if not install_dependencies():
            return 1
    
    else:
        print("无效选择")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
