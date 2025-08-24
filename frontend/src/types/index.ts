export interface NewsItem {
  id: number;
  title: string;
  source: string;
  content: string;
  summary: string;
  url?: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  key_points: string[];
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface NewsStats {
  total_news: number;
  today_news: number;
  week_news: number;
  month_news: number;
  last_fetch_time?: string;
  category_stats: Record<string, number>;
  importance_stats: Record<string, number>;
}

export interface FetchHistory {
  id: number;
  fetch_date: string;
  news_count: number;
  status: 'success' | 'failed' | 'partial';
  status_display: string;
  log_message: string;
  created_at: string;
}

export interface FetchStatus {
  is_fetching: boolean;
  progress: number;
  message: string;
  start_time?: string;
  estimated_completion?: string;
}

export interface ApiResponse<T> {
  results?: T[];
  count?: number;
  next?: string;
  previous?: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  tech_breakthrough: '技术突破',
  product_release: '产品发布',
  industry_news: '行业动态',
  policy_regulation: '政策法规',
  research_progress: '研究进展',
  application_case: '应用案例',
  other: '其他',
};

export const IMPORTANCE_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};