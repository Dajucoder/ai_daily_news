import api from './api';
import { 
  AIProvider, 
  AIProviderForm, 
  AIModel, 
  TestConnectionRequest 
} from '../types';

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  model_used?: string;
  service_type?: string;
  response_preview?: string;
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
  message: string;
}

class AIConfigService {
  // AI提供商管理
  async getProviders(): Promise<AIProvider[]> {
    const response = await api.get<AIProvider[]>('/api/chat/providers/');
    return response.data;
  }

  async createProvider(data: AIProviderForm): Promise<AIProvider> {
    const response = await api.post<AIProvider>('/api/chat/providers/', data);
    return response.data;
  }

  async updateProvider(id: number, data: Partial<AIProviderForm>): Promise<AIProvider> {
    const response = await api.patch<AIProvider>(`/api/chat/providers/${id}/`, data);
    return response.data;
  }

  async deleteProvider(id: number): Promise<void> {
    await api.delete(`/api/chat/providers/${id}/`);
  }

  // AI模型管理
  async getModels(providerId?: number): Promise<AIModel[]> {
    const params = providerId ? { provider_id: providerId } : {};
    const response = await api.get<AIModel[]>('/api/chat/models/', { params });
    return response.data;
  }

  async createModel(data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.post<AIModel>('/api/chat/models/', data);
    return response.data;
  }

  async updateModel(id: number, data: Partial<AIModel>): Promise<AIModel> {
    const response = await api.patch<AIModel>(`/api/chat/models/${id}/`, data);
    return response.data;
  }

  async deleteModel(id: number): Promise<void> {
    await api.delete(`/api/chat/models/${id}/`);
  }

  // 测试连接
  async testConnection(data: TestConnectionRequest): Promise<TestConnectionResponse> {
    const response = await api.post<TestConnectionResponse>('/api/chat/test-connection/', data);
    return response.data;
  }

  // 检测模型
  async detectModels(data: DetectModelsRequest): Promise<DetectModelsResponse> {
    const response = await api.post<DetectModelsResponse>('/api/chat/detect-models/', data);
    return response.data;
  }
}

const aiConfigService = new AIConfigService();
export default aiConfigService;
