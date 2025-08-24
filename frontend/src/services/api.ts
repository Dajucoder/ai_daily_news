import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 设置上海时区
const SHANGHAI_TIMEZONE = 'Asia/Shanghai';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 0, // 移除超时限制
  headers: {
    'Content-Type': 'application/json',
    'X-Timezone': SHANGHAI_TIMEZONE,
  },
});

// 时区工具函数
export const formatDateForShanghai = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const getCurrentShanghaiTime = (): string => {
  return new Date().toLocaleString('zh-CN', {
    timeZone: SHANGHAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// 获取认证令牌
const getAuthToken = () => {
  return localStorage.getItem('access_token');
};

// 设置认证令牌
export const setAuthToken = (token: string) => {
  localStorage.setItem('access_token', token);
};

// 移除认证令牌
export const removeAuthToken = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_info');
};

// 检查是否已登录
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data as { access: string };
          setAuthToken(access);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${access}`;
          }
          
          return api(originalRequest);
        } catch (refreshError) {
          removeAuthToken();
          window.location.href = '/login';
        }
      } else {
        removeAuthToken();
        window.location.href = '/login';
      }
    }
    
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;