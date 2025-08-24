"""
AI新闻代理主程序
整合RSS抓取和AI处理功能
"""
import json
import logging
import sys
import argparse
from datetime import datetime, date
from pathlib import Path
from typing import Dict, Any, Optional

from rss_fetcher import RSSFetcher, setup_logging
from ai_processor import AIProcessor


class NewsAgent:
    """新闻代理主类"""
    
    def __init__(self, output_dir: str = "output"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.fetcher = RSSFetcher()
        self.processor = AIProcessor()
        self.logger = logging.getLogger(__name__)
    
    def run_daily_collection(self, target_date: Optional[date] = None, progress_callback=None) -> Dict[str, Any]:
        """
        执行每日新闻收集和处理
        
        Args:
            target_date: 目标日期，默认为今天
            progress_callback: 进度回调函数
            
        Returns:
            处理结果报告
        """
        if target_date is None:
            target_date = date.today()
        
        self.logger.info(f"开始执行 {target_date} 的AI新闻收集任务")
        
        try:
            # 第一步：抓取RSS文章
            self.logger.info("步骤1: 抓取RSS文章")
            if progress_callback:
                progress_callback(15, "抓取RSS文章...")
            
            articles = self.fetcher.fetch_all_sources(target_date)
            
            if not articles:
                self.logger.warning("未抓取到任何文章")
                if progress_callback:
                    progress_callback(100, "完成，但未抓取到文章")
                return self._create_empty_report(target_date)
            
            self.logger.info(f"成功抓取 {len(articles)} 篇文章")
            if progress_callback:
                progress_callback(40, f"抓取到{len(articles)}篇文章，开始AI处理...")
            
            # 第二步：AI处理和分析
            self.logger.info("步骤2: AI处理和分析")
            processed_news = self.processor.process_articles(articles, progress_callback)
            
            if not processed_news:
                self.logger.warning("没有文章通过AI处理")
                if progress_callback:
                    progress_callback(100, "完成，但没有文章通过AI处理")
                return self._create_empty_report(target_date)
            
            self.logger.info(f"成功处理 {len(processed_news)} 篇新闻")
            
            # 第三步：生成每日报告
            self.logger.info("步骤3: 生成每日报告")
            if progress_callback:
                progress_callback(75, "生成每日报告...")
            
            report = self.processor.generate_daily_report(processed_news)
            report['collection_date'] = target_date.isoformat()
            report['raw_articles_count'] = len(articles)
            report['processed_articles_count'] = len(processed_news)
            
            # 第四步：保存结果
            self.logger.info("步骤4: 保存结果")
            if progress_callback:
                progress_callback(90, "保存结果...")
            
            self._save_results(report, target_date)
            
            self.logger.info("每日新闻收集任务完成")
            if progress_callback:
                progress_callback(100, f"完成！处理了{len(processed_news)}篇新闻")
            
            return report
            
        except Exception as e:
            self.logger.error(f"执行每日收集任务失败: {str(e)}")
            if progress_callback:
                progress_callback(0, f"处理失败: {str(e)}")
            raise
    
    def _create_empty_report(self, target_date: date) -> Dict[str, Any]:
        """创建空报告"""
        return {
            'collection_date': target_date.isoformat(),
            'summary': f'{target_date} 暂无AI相关新闻',
            'total_count': 0,
            'raw_articles_count': 0,
            'processed_articles_count': 0,
            'category_stats': {},
            'importance_stats': {},
            'top_stories': [],
            'all_news': [],
            'generated_time': datetime.now().isoformat()
        }
    
    def _save_results(self, report: Dict[str, Any], target_date: date):
        """
        保存结果到文件
        
        Args:
            report: 报告数据
            target_date: 目标日期
        """
        # 保存完整报告
        report_file = self.output_dir / f"ai_news_report_{target_date.strftime('%Y%m%d')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        self.logger.info(f"报告已保存到: {report_file}")
        
        # 保存简化版本（只包含标题和摘要）
        simplified_report = {
            'collection_date': report['collection_date'],
            'summary': report['summary'],
            'total_count': report['total_count'],
            'top_stories': [
                {
                    'title': story['title'],
                    'source': story['source'],
                    'summary': story['summary'],
                    'original_link': story['original_link'],
                    'importance': story['importance']
                }
                for story in report['top_stories']
            ],
            'generated_time': report['generated_time']
        }
        
        simplified_file = self.output_dir / f"ai_news_simplified_{target_date.strftime('%Y%m%d')}.json"
        with open(simplified_file, 'w', encoding='utf-8') as f:
            json.dump(simplified_report, f, ensure_ascii=False, indent=2)
        
        self.logger.info(f"简化报告已保存到: {simplified_file}")
    
    def get_latest_report(self) -> Optional[Dict[str, Any]]:
        """
        获取最新的报告
        
        Returns:
            最新报告数据，如果没有则返回None
        """
        # 查找最新的报告文件
        report_files = list(self.output_dir.glob("ai_news_report_*.json"))
        
        if not report_files:
            return None
        
        # 按文件名排序，获取最新的
        latest_file = sorted(report_files)[-1]
        
        try:
            with open(latest_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"读取最新报告失败: {str(e)}")
            return None
    
    def get_report_by_date(self, target_date: date) -> Optional[Dict[str, Any]]:
        """
        根据日期获取报告
        
        Args:
            target_date: 目标日期
            
        Returns:
            指定日期的报告数据，如果没有则返回None
        """
        report_file = self.output_dir / f"ai_news_report_{target_date.strftime('%Y%m%d')}.json"
        
        if not report_file.exists():
            return None
        
        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.logger.error(f"读取 {target_date} 报告失败: {str(e)}")
            return None
    
    def list_available_reports(self) -> list:
        """
        列出所有可用的报告
        
        Returns:
            报告日期列表
        """
        report_files = list(self.output_dir.glob("ai_news_report_*.json"))
        dates = []
        
        for file in report_files:
            try:
                date_str = file.stem.split('_')[-1]  # 提取日期部分
                dates.append(date_str)
            except:
                continue
        
        return sorted(dates)


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="AI新闻代理")
    parser.add_argument('--date', type=str, help='目标日期 (YYYY-MM-DD)，默认为今天')
    parser.add_argument('--output-dir', type=str, default='output', help='输出目录')
    parser.add_argument('--log-level', type=str, default='INFO', 
                       choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       help='日志级别')
    parser.add_argument('--show-latest', action='store_true', help='显示最新报告')
    parser.add_argument('--list-reports', action='store_true', help='列出所有报告')
    
    args = parser.parse_args()
    
    # 设置日志
    setup_logging(args.log_level)
    
    # 创建新闻代理
    agent = NewsAgent(args.output_dir)
    
    try:
        if args.show_latest:
            # 显示最新报告
            report = agent.get_latest_report()
            if report:
                print("=== 最新AI新闻报告 ===")
                print(f"日期: {report['collection_date']}")
                print(f"总结: {report['summary']}")
                print(f"新闻总数: {report['total_count']}")
                print("\n=== Top Stories ===")
                for story in report['top_stories']:
                    print(f"• {story['title']} [{story['source']}]")
                    print(f"  {story['summary'][:100]}...")
                    print(f"  链接: {story['original_link']}")
                    print()
            else:
                print("暂无可用报告")
        
        elif args.list_reports:
            # 列出所有报告
            reports = agent.list_available_reports()
            if reports:
                print("=== 可用报告 ===")
                for report_date in reports:
                    print(f"• {report_date}")
            else:
                print("暂无可用报告")
        
        else:
            # 执行新闻收集
            target_date = None
            if args.date:
                try:
                    target_date = datetime.strptime(args.date, '%Y-%m-%d').date()
                except ValueError:
                    print("错误: 日期格式应为 YYYY-MM-DD")
                    sys.exit(1)
            
            print(f"开始执行AI新闻收集任务...")
            report = agent.run_daily_collection(target_date)
            
            print("\n=== 收集完成 ===")
            print(f"日期: {report['collection_date']}")
            print(f"原始文章: {report['raw_articles_count']}")
            print(f"处理后新闻: {report['processed_articles_count']}")
            print(f"总结: {report['summary']}")
            
            if report['top_stories']:
                print("\n=== 重要新闻 ===")
                for story in report['top_stories']:
                    print(f"• {story['title']} [{story['source']}]")
                    print(f"  {story['summary'][:100]}...")
                    print()
    
    except KeyboardInterrupt:
        print("\n任务已取消")
        sys.exit(0)
    except Exception as e:
        print(f"执行失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
