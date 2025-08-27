"""
AI新闻代理API服务器
为Django后端提供RSS新闻抓取和处理服务
"""
import json
import logging
import os
import pytz
from datetime import datetime, date
from typing import Dict, Any, List, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time

from news_agent import NewsAgent
from rss_fetcher import setup_logging
from config import RSS_SOURCES
from model_manager import ModelManager

# 设置上海时区
SHANGHAI_TZ = pytz.timezone('Asia/Shanghai')

# 设置系统时区环境变量
os.environ['TZ'] = 'Asia/Shanghai'
if hasattr(time, 'tzset'):
    time.tzset()

app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 设置Flask应用无超时
app.config['PERMANENT_SESSION_LIFETIME'] = None
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# 全局变量
news_agent = NewsAgent()
model_manager = ModelManager()
fetch_status = {
    'is_fetching': False,
    'progress': 0,
    'message': '',
    'start_time': None,
    'estimated_completion': None,
    'last_error': None
}
fetch_lock = threading.Lock()


def update_fetch_status(progress: int, message: str, error: str = None):
    """更新抓取状态"""
    with fetch_lock:
        fetch_status.update({
            'progress': progress,
            'message': message,
            'last_error': error
        })
        # 添加日志记录
        logging.info(f"状态更新: {progress}% - {message}")
        if error:
            logging.error(f"错误: {error}")


def get_shanghai_time():
    """获取上海时间"""
    return datetime.now(SHANGHAI_TZ)


@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'timestamp': get_shanghai_time().isoformat(),
        'service': 'AI News Agent',
        'timezone': 'Asia/Shanghai'
    })


@app.route('/api/sources', methods=['GET'])
def get_sources():
    """获取RSS源列表"""
    return jsonify({
        'sources': RSS_SOURCES,
        'total_count': len(RSS_SOURCES)
    })


@app.route('/api/fetch-news', methods=['POST'])
def fetch_news():
    """开始抓取新闻"""
    global fetch_status
    
    data = request.get_json() or {}
    target_date_str = data.get('date')
    force_refresh = data.get('force_refresh', False)
    model_id = data.get('model_id')  # 新增：指定使用的模型
    
    # 检查是否正在抓取
    if fetch_status['is_fetching']:
        return jsonify({
            'error': '正在抓取新闻，请稍后再试',
            'status': fetch_status
        }), 409
    
    # 解析目标日期
    target_date = None
    if target_date_str:
        try:
            target_date = datetime.strptime(target_date_str, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': '日期格式错误，应为YYYY-MM-DD'}), 400
    else:
        target_date = get_shanghai_time().date()
    
    # 检查是否已有今日报告（除非强制刷新）
    if not force_refresh:
        existing_report = news_agent.get_report_by_date(target_date)
        if existing_report:
            return jsonify({
                'message': f'{target_date} 的报告已存在',
                'report': existing_report,
                'force_refresh_required': True
            })
    
    # 启动后台抓取任务
    def fetch_task():
        with fetch_lock:
            fetch_status.update({
                'is_fetching': True,
                'progress': 0,
                'message': '开始抓取新闻...',
                'start_time': get_shanghai_time().isoformat(),
                'estimated_completion': None,
                'last_error': None
            })
        
        try:
            # 如果指定了模型，先选择模型
            if model_id:
                update_fetch_status(5, f'选择AI模型: {model_id}...')
                selected_model = model_manager.select_model(model_id)
                if selected_model:
                    # 通知news_agent更新模型
                    news_agent.update_model(model_id)
                    logging.info(f"NewsAgent已更新为使用模型: {selected_model.model_name}")
                    update_fetch_status(10, f'已选择模型: {selected_model.model_name}')
                else:
                    logging.warning(f"指定的模型 {model_id} 不存在，将使用默认模型")
            
            # 使用统一的进度回调执行完整的抓取和处理流程
            def progress_callback(progress, message):
                update_fetch_status(progress, message)
            
            update_fetch_status(15, '初始化新闻代理...')
            
            # 使用news_agent的统一方法处理所有步骤
            report = news_agent.run_daily_collection(target_date, progress_callback)
            
            logging.info(f"抓取任务完成: 原始文章{report.get('raw_articles_count', 0)}篇，处理后{report.get('processed_articles_count', 0)}篇")
            
        except Exception as e:
            error_msg = f'抓取失败: {str(e)}'
            update_fetch_status(0, error_msg, str(e))
            logging.error(f"抓取任务失败: {error_msg}", exc_info=True)
        
        finally:
            # 确保状态被重置
            with fetch_lock:
                fetch_status['is_fetching'] = False
                logging.info("抓取任务结束，状态已重置")
    
    # 启动后台线程
    thread = threading.Thread(target=fetch_task)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'message': '开始抓取新闻',
        'target_date': target_date.isoformat()
    })


@app.route('/api/fetch-status', methods=['GET'])
def get_fetch_status():
    """获取抓取状态"""
    return jsonify(fetch_status.copy())


@app.route('/api/reports', methods=['GET'])
def get_reports():
    """获取报告列表"""
    try:
        available_reports = news_agent.list_available_reports()
        reports_info = []
        
        for report_date in available_reports:
            try:
                target_date = datetime.strptime(report_date, '%Y%m%d').date()
                report = news_agent.get_report_by_date(target_date)
                if report:
                    reports_info.append({
                        'date': target_date.isoformat(),
                        'total_count': report.get('total_count', 0),
                        'summary': report.get('summary', ''),
                        'generated_time': report.get('generated_time')
                    })
            except:
                continue
        
        # 按日期倒序排序
        reports_info.sort(key=lambda x: x['date'], reverse=True)
        
        return jsonify({
            'reports': reports_info,
            'total_count': len(reports_info)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/reports/<date>', methods=['GET', 'DELETE'])
def handle_report_by_date(date):
    """根据日期获取或删除报告"""
    if request.method == 'GET':
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d').date()
            report = news_agent.get_report_by_date(target_date)
            
            if not report:
                return jsonify({'error': f'未找到 {date} 的报告'}), 404
            
            return jsonify(report)
        
        except ValueError:
            return jsonify({'error': '日期格式错误，应为YYYY-MM-DD'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'DELETE':
        try:
            target_date = datetime.strptime(date, '%Y-%m-%d').date()
            success = news_agent.delete_report_by_date(target_date)
            
            if not success:
                return jsonify({'error': f'未找到 {date} 的报告或删除失败'}), 404
            
            return jsonify({'message': f'成功删除 {date} 的报告'})
        
        except ValueError:
            return jsonify({'error': '日期格式错误，应为YYYY-MM-DD'}), 400
        except Exception as e:
            return jsonify({'error': str(e)}), 500


@app.route('/api/reports/latest', methods=['GET'])
def get_latest_report():
    """获取最新报告"""
    try:
        report = news_agent.get_latest_report()
        
        if not report:
            return jsonify({'error': '暂无可用报告'}), 404
        
        return jsonify(report)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/news/structured', methods=['GET'])
def get_structured_news():
    """
    获取结构化的新闻数据，用于与Django后端集成
    """
    try:
        date_param = request.args.get('date')
        
        if date_param:
            try:
                target_date = datetime.strptime(date_param, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'error': '日期格式错误，应为YYYY-MM-DD'}), 400
        else:
            target_date = get_shanghai_time().date()
        
        report = news_agent.get_report_by_date(target_date)
        
        if not report:
            return jsonify({
                'error': f'未找到 {target_date} 的报告',
                'date': target_date.isoformat(),
                'news_items': []
            }), 404
        
        # 转换为Django后端需要的格式
        news_items = []
        # 尝试从不同的字段获取新闻数据
        news_data = report.get('all_news', []) or report.get('top_stories', [])
        for news in news_data:
            # 映射分类
            category_mapping = {
                'tech_breakthrough': 'tech_breakthrough',
                'product_release': 'product_release', 
                'industry_news': 'industry_news',
                'policy_regulation': 'policy_regulation',
                'research_progress': 'research_progress',
                'application_case': 'application_case',
                'funding_acquisition': 'industry_news',  # 映射到行业动态
                'other': 'other'
            }
            
            news_item = {
                'title': news['title'],
                'source': news['source'],
                'content': news['content'],
                'summary': news['summary'],
                'original_link': news['original_link'],  # 保持原字段名
                'url': news['original_link'],  # 同时提供url字段以兼容
                'category': category_mapping.get(news['category'], 'other'),
                'importance': news['importance'],
                'key_points': news['key_points'],
                'timestamp': news['processed_time'],
                'source_description': news.get('source_description', ''),
                'tags': news.get('tags', [])
            }
            news_items.append(news_item)
        
        return jsonify({
            'date': target_date.isoformat(),
            'total_count': len(news_items),
            'summary': report.get('summary', ''),
            'news_items': news_items,
            'category_stats': report.get('category_stats', {}),
            'importance_stats': report.get('importance_stats', {}),
            'generated_time': report.get('generated_time')
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/models', methods=['GET'])
def get_available_models():
    """获取可用的AI模型列表"""
    try:
        models = model_manager.get_available_models()
        return jsonify({
            'models': model_manager.list_models_summary(),
            'total_count': len(models),
            'current_model': model_manager.get_current_model().model_id if model_manager.get_current_model() else None
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/models/select', methods=['POST'])
def select_model():
    """选择AI模型"""
    try:
        data = request.get_json() or {}
        model_id = data.get('model_id')
        
        if not model_id:
            return jsonify({'error': '请提供model_id参数'}), 400
        
        selected_model = model_manager.select_model(model_id)
        if not selected_model:
            return jsonify({'error': f'未找到指定的模型: {model_id}'}), 404
        
        # 通知news_agent更新模型
        news_agent.update_model(model_id)
        logging.info(f"NewsAgent已更新为使用模型: {selected_model.model_name}")
        
        return jsonify({
            'message': f'已选择模型: {selected_model.model_name}',
            'model': {
                'model_id': selected_model.model_id,
                'model_name': selected_model.model_name,
                'provider_name': selected_model.provider_name,
                'provider_type': selected_model.provider_type
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/models/current', methods=['GET'])
def get_current_model():
    """获取当前选择的AI模型"""
    try:
        current_model = model_manager.get_current_model()
        if not current_model:
            return jsonify({'error': '未选择任何模型'}), 404
        
        return jsonify({
            'model': {
                'model_id': current_model.model_id,
                'model_name': current_model.model_name,
                'provider_name': current_model.provider_name,
                'provider_type': current_model.provider_type,
                'max_tokens': current_model.max_tokens,
                'support_functions': current_model.support_functions,
                'support_vision': current_model.support_vision
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    setup_logging()
    
    # 设置无超时配置
    import socket
    socket.setdefaulttimeout(None)  # 设置socket无超时
    
    print("启动AI新闻代理API服务器...")
    print(f"当前时间: {get_shanghai_time().strftime('%Y-%m-%d %H:%M:%S')} (上海时间)")
    print("可用端点:")
    print("  GET  /api/health          - 健康检查")
    print("  GET  /api/sources         - RSS源列表")
    print("  POST /api/fetch-news      - 开始抓取新闻")
    print("  GET  /api/fetch-status    - 抓取状态")
    print("  GET  /api/reports         - 报告列表")
    print("  GET  /api/reports/latest  - 最新报告")
    print("  GET  /api/reports/<date>  - 指定日期报告")
    print("  DELETE /api/reports/<date> - 删除指定日期报告")
    print("  GET  /api/news/structured - 结构化新闻数据")
    print("  GET  /api/models           - 可用模型列表")
    print("  POST /api/models/select    - 选择模型")
    print("  GET  /api/models/current   - 当前选择的模型")
    print("配置: 无超时限制，使用上海时区")
    
    # 启动Flask应用，设置无超时
    from werkzeug.serving import WSGIRequestHandler
    WSGIRequestHandler.timeout = None  # 设置请求处理无超时
    
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
