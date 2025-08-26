#!/usr/bin/env python
"""
检查迁移文件的脚本
"""
import os
import django
from django.core.management import execute_from_command_line

if __name__ == "__main__":
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_news_backend.settings')
    django.setup()
    
    from django.db import connection
    from django.core.management.commands.migrate import Command as MigrateCommand
    
    print("=== 当前数据库表 ===")
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        for table in tables:
            print(f"- {table[0]}")
    
    print("\n=== 检查迁移状态 ===")
    execute_from_command_line(['manage.py', 'showmigrations'])
    
    print("\n=== 计划执行的迁移 ===")
    execute_from_command_line(['manage.py', 'migrate', '--plan'])
