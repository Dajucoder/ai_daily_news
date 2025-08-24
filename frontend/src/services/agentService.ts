import axios from 'axios';
import { formatDateForShanghai } from './api';

const AGENT_BASE_URL = process.env.REACT_APP_AGENT_URL || 'http://localhost:5001';

// 创建专门用于AI代理的axios实例，无超时限制
const agentApi = axios.create({
  baseURL: AGENT_BASE_URL,
  timeout: 0, // 无超时限制
  headers: {
    'Content-Type': 'application/json',
    'X-Timezone': 'Asia/Shanghai',
  },
});

// 请求拦截器
agentApi.interceptors.request.use(
  (config) => {
    console.log('Agent API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
agentApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Agent API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export interface FetchNewsRequest {
  date?: string;
  force_refresh?: boolean;
}

export interface FetchStatus {
  is_fetching: boolean;
  progress: number;
  message: string;
  start_time?: string;
  estimated_completion?: string;
  last_error?: string;
}

export interface NewsReport {
  date: string;
  total_count: number;
  summary: string;
  news_items: any[];
  category_stats: Record<string, number>;
  importance_stats: Record<string, number>;
  generated_time: string;
}

// AI代理服务类
class AgentService {
  // 健康检查
  async healthCheck() {
    const response = await agentApi.get('/api/health');
    return response.data;
  }

  // 获取RSS源列表
  async getSources() {
    const response = await agentApi.get('/api/sources');
    return response.data;
  }

  // 开始抓取新闻
  async fetchNews(request: FetchNewsRequest = {}) {
    const response = await agentApi.post('/api/fetch-news', request);
    return response.data;
  }

  // 获取抓取状态
  async getFetchStatus(): Promise<FetchStatus> {
    const response = await agentApi.get('/api/fetch-status');
    return response.data as FetchStatus;
  }

  // 获取报告列表
  async getReports() {
    const response = await agentApi.get('/api/reports');
    return response.data;
  }

  // 获取最新报告
  async getLatestReport() {
    const response = await agentApi.get('/api/reports/latest');
    return response.data;
  }

  // 根据日期获取报告
  async getReportByDate(date: string) {
    const response = await agentApi.get(`/api/reports/${date}`);
    return response.data;
  }

  // 获取结构化新闻数据
  async getStructuredNews(date?: string): Promise<NewsReport> {
    const params = date ? { date } : {};
    const response = await agentApi.get('/api/news/structured', { params });
    return response.data as NewsReport;
  }

  // 轮询抓取状态直到完成
  async pollFetchStatus(
    onProgress?: (status: FetchStatus) => void,
    pollInterval: number = 2000
  ): Promise<FetchStatus> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getFetchStatus();
          
          if (onProgress) {
            onProgress(status);
          }

          if (!status.is_fetching) {
            if (status.last_error) {
              reject(new Error(status.last_error));
            } else {
              resolve(status);
            }
            return;
          }

          // 继续轮询
          setTimeout(poll, pollInterval);
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // 格式化时间为上海时区
  formatTime(timestamp: string): string {
    return formatDateForShanghai(timestamp);
  }
}

export const agentService = new AgentService();
export default agentService;