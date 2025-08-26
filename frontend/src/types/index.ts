export interface NewsItem {
  id: number;
  title: string;
  source: string;
  source_description?: string;
  content: string;
  summary: string;
  url?: string;
  category: string;
  importance: 'high' | 'medium' | 'low';
  key_points: string[];
  tags?: string[];
  timestamp: string;
  created_at: string;
  updated_at: string;
}

export interface NewsStats {
  total_count: number;
  today_count: number;
  week_count: number;
  category_stats: Array<{category: string; count: number}>;
  importance_stats: Array<{importance: string; count: number}>;
  source_stats: Array<{source: string; count: number}>;
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
  last_error?: string;
}

export interface AgentStatus {
  available: boolean;
  status: 'healthy' | 'unavailable' | 'error';
  is_fetching?: boolean;
  last_message?: string;
  progress?: number;
  message?: string;
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

// 用户相关类型
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  date_joined: string;
  profile?: UserProfile;
}

export interface UserProfile {
  theme: 'light' | 'dark';
  language: 'zh-cn' | 'en';
  notifications_enabled: boolean;
  email_notifications: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

// 聊天相关类型
export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  token_count?: number;
  thinking?: string; // AI思考过程
  model_name?: string; // 使用的模型名称
  model_provider?: string; // 模型提供商
}

export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  messages?: ChatMessage[];
  message_count?: number;
  last_message?: {
    content: string;
    role: string;
    timestamp: string;
  };
}

export interface ChatSettings {
  default_provider?: number;
  default_provider_name?: string;
  default_model?: number;
  default_model_name?: string;
  max_tokens: number;
  temperature: number;
  system_prompt: string;
}

export interface SendMessageRequest {
  conversation_id?: number;
  message: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
  conversation_id: number;
}

export interface CreateConversationRequest {
  title: string;
  first_message?: string;
}

// AI配置相关类型
export interface AIProvider {
  id: number;
  name: string;
  provider_type: 'openai' | 'siliconflow' | 'freegpt' | 'qwen' | 'gemini' | 'claude' | 'custom';
  api_key?: string;
  api_base_url: string;
  is_active: boolean;
  is_default: boolean;
  models_count: number;
  created_at: string;
  updated_at: string;
}

export interface AIModel {
  id: number;
  provider: number;
  provider_name: string;
  model_id: string;
  model_name: string;
  description?: string;
  max_tokens: number;
  support_functions: boolean;
  support_vision: boolean;
  input_price?: number;
  output_price?: number;
  is_active: boolean;
  created_at: string;
}

export interface AIProviderForm {
  name: string;
  provider_type: string;
  api_key?: string;  // 编辑时可选
  api_base_url: string;
  is_active: boolean;
  is_default: boolean;
}

export interface AIModelForm {
  provider: number;
  model_id: string;
  model_name: string;
  description?: string;
  max_tokens: number;
  support_functions: boolean;
  support_vision: boolean;
  input_price?: number;
  output_price?: number;
  is_active: boolean;
}

export interface TestConnectionRequest {
  api_key: string;
  api_base_url: string;
  test_model?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  model_used?: string;
}

export interface DetectModelsRequest {
  provider_id: number;
}

export interface DetectModelsResponse {
  success: boolean;
  models: Array<{
    model_id: string;
    model_name: string;
    description: string;
    created?: number;
  }>;
  count: number;
  message?: string;
}