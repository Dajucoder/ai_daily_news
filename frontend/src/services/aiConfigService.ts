import api from './api';
import { 
  AIProvider, 
  AIModel, 
  AIProviderForm, 
  AIModelForm,
  TestConnectionRequest,
  TestConnectionResponse,
  DetectModelsRequest,
  DetectModelsResponse
} from '../types';

class AIConfigService {
  /**
   * AI服务提供商管理
   */
  
  // 获取提供商列表
  async getProviders(): Promise<AIProvider[]> {
    try {
      const response = await api.get('/api/chat/providers/');
      // 检查返回数据格式，可能是分页格式
      const data = response.data as any;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('获取AI提供商列表失败:', error);
      return []; // 失败时返回空数组而不是抛出异常
    }
  }
  
  // 获取提供商详情
  async getProvider(id: number): Promise<AIProvider> {
    try {
      const response = await api.get<AIProvider>(`/api/chat/providers/${id}/`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '获取AI提供商详情失败' };
    }
  }
  
  // 创建提供商
  async createProvider(data: AIProviderForm): Promise<AIProvider> {
    try {
      const response = await api.post<AIProvider>('/api/chat/providers/', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '创建AI提供商失败' };
    }
  }
  
  // 更新提供商
  async updateProvider(id: number, data: Partial<AIProviderForm>): Promise<AIProvider> {
    try {
      const response = await api.patch<AIProvider>(`/api/chat/providers/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '更新AI提供商失败' };
    }
  }
  
  // 删除提供商
  async deleteProvider(id: number): Promise<void> {
    try {
      await api.delete(`/api/chat/providers/${id}/`);
    } catch (error: any) {
      throw error.response?.data || { message: '删除AI提供商失败' };
    }
  }
  
  /**
   * AI模型管理
   */
  
  // 获取模型列表
  async getModels(providerId?: number): Promise<AIModel[]> {
    try {
      const params = providerId ? { provider_id: providerId } : {};
      const response = await api.get('/api/chat/models/', { params });
      // 检查返回数据格式，可能是分页格式
      const data = response.data as any;
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        return [];
      }
    } catch (error: any) {
      console.error('获取AI模型列表失败:', error);
      return []; // 失败时返回空数组而不是抛出异常
    }
  }
  
  // 获取模型详情
  async getModel(id: number): Promise<AIModel> {
    try {
      const response = await api.get<AIModel>(`/api/chat/models/${id}/`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '获取AI模型详情失败' };
    }
  }
  
  // 创建模型
  async createModel(data: AIModelForm): Promise<AIModel> {
    try {
      const response = await api.post<AIModel>('/api/chat/models/', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '创建AI模型失败' };
    }
  }
  
  // 更新模型
  async updateModel(id: number, data: Partial<AIModelForm>): Promise<AIModel> {
    try {
      const response = await api.patch<AIModel>(`/api/chat/models/${id}/`, data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '更新AI模型失败' };
    }
  }
  
  // 删除模型
  async deleteModel(id: number): Promise<void> {
    try {
      await api.delete(`/api/chat/models/${id}/`);
    } catch (error: any) {
      throw error.response?.data || { message: '删除AI模型失败' };
    }
  }
  
  /**
   * 测试和检测功能
   */
  
  // 测试API连接
  async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    try {
      const response = await api.post<TestConnectionResponse>('/api/chat/test-connection/', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: 'API连接测试失败' };
    }
  }
  
  // 检测可用模型
  async detectModels(data: DetectModelsRequest): Promise<DetectModelsResponse> {
    try {
      const response = await api.post<DetectModelsResponse>('/api/chat/detect-models/', data);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { message: '模型检测失败' };
    }
  }
}

export const aiConfigService = new AIConfigService();
export default aiConfigService;
