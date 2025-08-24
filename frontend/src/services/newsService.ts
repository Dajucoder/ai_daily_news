import api from './api';
import { NewsItem, NewsStats, FetchHistory, FetchStatus, ApiResponse } from '../types';

export class NewsService {
  // 获取新闻列表
  static async getNews(params: {
    page?: number;
    page_size?: number;
    search?: string;
    category?: string;
    importance?: string;
    days?: number;
  }): Promise<ApiResponse<NewsItem>> {
    const response = await api.get('/api/news/', { params });
    return response.data as ApiResponse<NewsItem>;
  }

  // 获取新闻详情
  static async getNewsDetail(id: number): Promise<NewsItem> {
    const response = await api.get(`/api/news/${id}/`);
    return response.data as NewsItem;
  }

  // 获取新闻统计
  static async getStats(): Promise<NewsStats> {
    const response = await api.get('/api/news/stats/');
    return response.data as NewsStats;
  }

  // 获取获取历史
  static async getFetchHistory(params: {
    page?: number;
    page_size?: number;
    days?: number;
  }): Promise<ApiResponse<FetchHistory>> {
    const response = await api.get('/api/history/', { params });
    return response.data as ApiResponse<FetchHistory>;
  }

  // 获取新闻
  static async fetchNews(params: {
    force_refresh?: boolean;
    max_news_count?: number;
  }): Promise<{ message: string }> {
    const response = await api.post('/api/service/fetch_news/', params);
    return response.data as { message: string };
  }

  // 获取获取状态
  static async getFetchStatus(): Promise<FetchStatus> {
    const response = await api.get('/api/service/fetch_status/');
    return response.data as FetchStatus;
  }
}

// 导出实例
export const newsService = new NewsService();