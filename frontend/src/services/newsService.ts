import api from './api';
import { NewsItem, NewsStats, FetchHistory, FetchStatus, ApiResponse } from '../types';

// 简单的缓存机制
interface CacheItem<T> {
  data: T;
  timestamp: number;
  key: string;
}

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();
  private readonly CACHE_DURATION = 30 * 1000; // 30秒缓存

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      key
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const apiCache = new ApiCache();

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
    // 生成缓存键
    const cacheKey = `news_${JSON.stringify(params)}`;
    
    // 尝试从缓存获取
    const cached = apiCache.get<ApiResponse<NewsItem>>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 发起API请求
    const response = await api.get('/api/news/news/', { params });
    const data = response.data as ApiResponse<NewsItem>;
    
    // 缓存结果
    apiCache.set(cacheKey, data);
    
    return data;
  }

  // 获取新闻详情
  static async getNewsDetail(id: number): Promise<NewsItem> {
    const response = await api.get(`/api/news/news/${id}/`);
    return response.data as NewsItem;
  }

  // 删除新闻
  static async deleteNews(id: number): Promise<void> {
    await api.delete(`/api/news/news/${id}/`);
    // 清除相关缓存
    apiCache.clear();
  }

  // 获取新闻统计
  static async getStats(): Promise<NewsStats> {
    const cacheKey = 'stats';
    
    // 尝试从缓存获取
    const cached = apiCache.get<NewsStats>(cacheKey);
    if (cached) {
      return cached;
    }
    
    // 发起API请求
    const response = await api.get('/api/news/news/stats/');
    const data = response.data as NewsStats;
    
    // 缓存结果
    apiCache.set(cacheKey, data);
    
    return data;
  }

  // 获取获取历史
  static async getFetchHistory(params: {
    page?: number;
    page_size?: number;
    days?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<FetchHistory>> {
    const response = await api.get('/api/news/history/', { params });
    return response.data as ApiResponse<FetchHistory>;
  }

  // 获取系统配置
  static async getSystemConfigs(): Promise<any[]> {
    const response = await api.get('/api/news/config/');
    return response.data as any[];
  }

  // 保存系统配置
  static async saveSystemConfig(key: string, value: any): Promise<any> {
    const response = await api.put(`/api/news/config/${key}/`, { value });
    return response.data;
  }

  // 批量保存系统配置
  static async saveSystemConfigs(configs: Record<string, any>): Promise<any> {
    const promises = Object.entries(configs).map(([key, value]) => 
      this.saveSystemConfig(key, value)
    );
    return Promise.all(promises);
  }

  // 获取新闻
  static async fetchNews(params: {
    force_refresh?: boolean;
    max_news_count?: number;
  }): Promise<{ message: string }> {
    const response = await api.post('/api/news/service/fetch_news/', params);
    // 清除缓存，因为有新数据
    apiCache.clear();
    return response.data as { message: string };
  }

  // 获取获取状态
  static async getFetchStatus(): Promise<FetchStatus> {
    const response = await api.get('/api/news/service/fetch_status/');
    return response.data as FetchStatus;
  }
}

// 导出实例
export const newsService = new NewsService();