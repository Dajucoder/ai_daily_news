import api from './api';
import {
  Conversation,
  ChatMessage,
  ChatSettings,
  SendMessageRequest,
  SendMessageResponse,
  CreateConversationRequest,
  ApiResponse,
  AIModel,
  AIProvider
} from '../types';

export const chatService = {
  // 获取会话列表
  getConversations: async (page = 1, pageSize = 20): Promise<ApiResponse<Conversation>> => {
    const response = await api.get<ApiResponse<Conversation>>('/api/chat/conversations/', {
      params: { page, page_size: pageSize }
    });
    return response.data;
  },

  // 获取会话详情
  getConversation: async (conversationId: number): Promise<Conversation> => {
    const response = await api.get<Conversation>(`/api/chat/conversations/${conversationId}/`);
    return response.data;
  },

  // 创建新会话
  createConversation: async (data: CreateConversationRequest): Promise<Conversation> => {
    const response = await api.post<Conversation>('/api/chat/conversations/', data);
    return response.data;
  },

  // 更新会话
  updateConversation: async (conversationId: number, data: Partial<Conversation>): Promise<Conversation> => {
    const response = await api.patch<Conversation>(`/api/chat/conversations/${conversationId}/`, data);
    return response.data;
  },

  // 删除会话
  deleteConversation: async (conversationId: number): Promise<void> => {
    await api.delete(`/api/chat/conversations/${conversationId}/`);
  },

  // 获取会话消息
  getConversationMessages: async (conversationId: number, limit = 50): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/api/chat/conversations/${conversationId}/messages/`, {
      params: { limit }
    });
    return response.data;
  },

  // 发送消息
  sendMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await api.post<SendMessageResponse>('/api/chat/send-message/', data);
    return response.data;
  },

  // 发送简单消息
  sendSimpleMessage: async (data: SendMessageRequest): Promise<SendMessageResponse> => {
    const response = await api.post<SendMessageResponse>('/api/chat/send-message-simple/', data);
    return response.data;
  },

  // 获取聊天设置
  getChatSettings: async (): Promise<ChatSettings> => {
    const response = await api.get<ChatSettings>('/api/chat/settings/');
    return response.data;
  },

  // 更新聊天设置
  updateChatSettings: async (data: Partial<ChatSettings>): Promise<ChatSettings> => {
    const response = await api.patch<ChatSettings>('/api/chat/settings/', data);
    return response.data;
  },

  // 获取AI模型列表
  getAIModels: async (providerId?: number): Promise<AIModel[]> => {
    const params = providerId ? { provider_id: providerId } : {};
    const response = await api.get<AIModel[]>('/api/chat/models/', { params });
    return response.data;
  },

  // 获取AI服务提供商列表
  getAIProviders: async (): Promise<AIProvider[]> => {
    const response = await api.get<AIProvider[]>('/api/chat/providers/');
    return response.data;
  }
};
