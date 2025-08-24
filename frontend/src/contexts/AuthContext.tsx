import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { User, AuthContextType, RegisterData } from '../types';
import authService from '../services/authService';
import { isAuthenticated } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          // 从本地存储获取用户信息
          const localUser = authService.getLocalUser();
          if (localUser) {
            setUser(localUser);
            
            // 尝试刷新用户信息，但失败时不要注销
            try {
              const freshUser = await authService.getCurrentUser();
              setUser(freshUser);
            } catch (error) {
              console.warn('刷新用户信息失败，使用本地缓存:', error);
              // 保持使用本地缓存的用户信息，不要注销
            }
          } else {
            // 如果没有本地用户信息但有token，清除token
            await authService.logout();
          }
        }
      } catch (error) {
        console.error('初始化认证状态失败:', error);
        // 只有在严重错误时才注销
        if (error instanceof Error && error.message.includes('token')) {
          await authService.logout();
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ username, password });
      setUser(response.user);
      message.success('登录成功！');
    } catch (error: any) {
      console.error('登录失败:', error);
      const errorMessage = error.username?.[0] || error.password?.[0] || error.non_field_errors?.[0] || error.message || '登录失败';
      message.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      setUser(response.user);
      message.success('注册成功！');
    } catch (error: any) {
      console.error('注册失败:', error);
      const errorMessage = error.username?.[0] || error.email?.[0] || error.password?.[0] || error.non_field_errors?.[0] || error.message || '注册失败';
      message.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      message.success('已安全退出');
    } catch (error) {
      console.error('注销失败:', error);
      // 即使注销失败也要清除本地状态
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      message.success('个人信息更新成功');
    } catch (error: any) {
      console.error('更新个人信息失败:', error);
      const errorMessage = error.email?.[0] || error.message || '更新失败';
      message.error(errorMessage);
      throw error;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (isAuthenticated()) {
        const freshUser = await authService.getCurrentUser();
        setUser(freshUser);
      }
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
