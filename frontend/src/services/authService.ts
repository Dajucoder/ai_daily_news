import api, { setAuthToken, removeAuthToken } from './api';

import { User as UserType } from '../types';

export interface User extends UserType {}

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface UserStats {
  total_news: number;
  user_joined_days: number;
  username: string;
  email: string;
  join_date: string;
}

class AuthService {
  /**
   * 用户登录
   */
  async login(data: LoginData): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/login/', data);
      const { access, refresh, user } = response.data;
      
      // 保存令牌和用户信息
      setAuthToken(access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '登录失败' };
    }
  }

  /**
   * 用户注册
   */
  async register(data: RegisterData): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>('/api/auth/register/', data);
      const { access, refresh, user } = response.data;
      
      // 注册成功后自动登录
      setAuthToken(access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user_info', JSON.stringify(user));
      
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '注册失败' };
    }
  }

  /**
   * 用户注销
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await api.post('/api/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.warn('注销请求失败，但继续清除本地数据');
    } finally {
      removeAuthToken();
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await api.get<User>('/api/auth/profile/');
      localStorage.setItem('user_info', JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '获取用户信息失败' };
    }
  }

  /**
   * 更新用户信息
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      const response = await api.patch('/api/auth/profile/update/', data);
      const user = (response.data as { user: User }).user;
      localStorage.setItem('user_info', JSON.stringify(user));
      return user;
    } catch (error: any) {
      throw error.response?.data || { message: '更新用户信息失败' };
    }
  }

  /**
   * 修改密码
   */
  async changePassword(data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }): Promise<void> {
    try {
      await api.post('/api/auth/change-password/', data);
    } catch (error: any) {
      throw error.response?.data || { message: '修改密码失败' };
    }
  }

  /**
   * 获取用户配置
   */
  async getUserSettings(): Promise<User['profile']> {
    try {
      const response = await api.get('/api/auth/settings/');
      return response.data as User['profile'];
    } catch (error: any) {
      throw error.response?.data || { message: '获取用户配置失败' };
    }
  }

  /**
   * 更新用户配置
   */
  async updateUserSettings(settings: Partial<User['profile']>): Promise<User['profile']> {
    try {
      const response = await api.patch('/api/auth/settings/update/', settings);
      return (response.data as { settings: User['profile'] }).settings;
    } catch (error: any) {
      throw error.response?.data || { message: '更新用户配置失败' };
    }
  }

  /**
   * 获取用户统计
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await api.get<UserStats>('/api/auth/stats/');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '获取用户统计失败' };
    }
  }

  /**
   * 获取本地存储的用户信息
   */
  getLocalUser(): User | null {
    try {
      const userStr = localStorage.getItem('user_info');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.getLocalUser();
    return !!token && !!user;
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('没有刷新令牌');
      }

      const response = await api.post('/api/auth/token/refresh/', {
        refresh: refreshToken
      });

      const { access } = response.data as { access: string };
      setAuthToken(access);
      return access;
    } catch (error: any) {
      removeAuthToken();
      throw error.response?.data || { message: '刷新令牌失败' };
    }
  }

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<{ avatar_url: string; message: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post<{ avatar_url: string; message: string }>(
        '/api/auth/profile/upload-avatar/', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '头像上传失败' };
    }
  }
}

export const authService = new AuthService();
export default authService;
