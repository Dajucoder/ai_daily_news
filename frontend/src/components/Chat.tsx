import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Input,
  Button,
  List,
  Typography,
  Card,
  Avatar,
  Space,
  message,
  Spin,
  Empty,
  Dropdown,
  Modal,
  Form,
  Drawer,
  Slider,
  Divider,
  Row,
  Col,
  Tag,
  Select
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  SettingOutlined,
  DeleteOutlined,
  EditOutlined,
  UserOutlined,
  RobotOutlined,
  MenuOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { chatService } from '../services/chatService';
import aiConfigService from '../services/aiConfigService';
import { Conversation, ChatMessage, ChatSettings, AIProvider, AIModel } from '../types';
import moment from 'moment';
import MarkdownMessage from './MarkdownMessage';
import ThinkingProcess from './ThinkingProcess';

const { Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Chat: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [siderCollapsed, setSiderCollapsed] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [newConversationModal, setNewConversationModal] = useState(false);
  const [editTitleModal, setEditTitleModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  // 滚动到消息底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载AI配置
  const loadAIConfig = async () => {
    try {
      const [providersData, modelsData] = await Promise.all([
        aiConfigService.getProviders(),
        aiConfigService.getModels()
      ]);
      setProviders(Array.isArray(providersData) ? providersData : []);
      setModels(Array.isArray(modelsData) ? modelsData : []);
    } catch (error: any) {
      console.error('加载AI配置失败:', error);
      setProviders([]);
      setModels([]);
    }
  };

  // 加载会话列表
  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await chatService.getConversations();
      setConversations(response.results || []);
    } catch (error) {
      message.error('加载会话列表失败');
      console.error('Load conversations error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载会话消息
  const loadMessages = async (conversationId: number) => {
    try {
      const conversationMessages = await chatService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      message.error('加载消息失败');
      console.error('Load messages error:', error);
    }
  };

  // 加载聊天设置
  const loadChatSettings = async () => {
    try {
      const settings = await chatService.getChatSettings();
      setChatSettings(settings);
      settingsForm.setFieldsValue(settings);
    } catch (error) {
      message.error('加载聊天设置失败');
      console.error('Load chat settings error:', error);
    }
  };

  // 发送消息
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    setSendingMessage(true);
    
    const userMessage = inputMessage.trim();
    setInputMessage('');

    try {
      // 添加用户消息到界面
      const userMsg: ChatMessage = {
        id: Date.now(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMsg]);
      scrollToBottom();

      // 发送消息并获取回复
      const response = await chatService.sendSimpleMessage({
        conversation_id: currentConversation?.id,
        message: userMessage
      });
      
      // 更新当前会话ID和会话列表
      if (!currentConversation || currentConversation.id !== response.conversation_id) {
        try {
          const conversation = await chatService.getConversation(response.conversation_id);
          setCurrentConversation(conversation);
        } catch (error) {
          console.error('Failed to load conversation:', error);
        }
      }
      
      // 立即刷新会话列表
      loadConversations();
      
      // 添加AI回复到界面
      setMessages(prev => [...prev, response.message]);
      
      // 强制更新刷新时间，触发自动刷新
      setLastRefreshTime(Date.now());
      
      setTimeout(scrollToBottom, 100);

    } catch (error: any) {
      message.error(`发送消息失败: ${error.response?.data?.error || error.message || '未知错误'}`);
      console.error('Send message error:', error);
      // 移除失败的用户消息
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSendingMessage(false);
    }
  };

  // 创建新会话
  const createNewConversation = async (values: any) => {
    try {
      const conversation = await chatService.createConversation({
        title: values.title,
        first_message: values.first_message
      });
      
      setConversations(prev => [conversation, ...prev]);
      setCurrentConversation(conversation);
      setNewConversationModal(false);
      form.resetFields();
      
      if (values.first_message) {
        loadMessages(conversation.id);
      } else {
        setMessages([]);
      }
      
      message.success('创建会话成功');
    } catch (error) {
      message.error('创建会话失败');
      console.error('Create conversation error:', error);
    }
  };

  // 选择会话
  const selectConversation = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    loadMessages(conversation.id);
  };

  // 删除会话
  const deleteConversation = async (conversationId: number) => {
    try {
      await chatService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      message.success('删除会话成功');
    } catch (error) {
      message.error('删除会话失败');
      console.error('Delete conversation error:', error);
    }
  };

  // 更新会话标题
  const updateConversationTitle = async (values: any) => {
    if (!editingConversation) return;

    try {
      const updatedConversation = await chatService.updateConversation(
        editingConversation.id,
        { title: values.title }
      );
      
      setConversations(prev => 
        prev.map(c => c.id === editingConversation.id ? updatedConversation : c)
      );
      
      if (currentConversation?.id === editingConversation.id) {
        setCurrentConversation(updatedConversation);
      }
      
      setEditTitleModal(false);
      setEditingConversation(null);
      editForm.resetFields();
      message.success('更新标题成功');
    } catch (error) {
      message.error('更新标题失败');
      console.error('Update title error:', error);
    }
  };

  // 更新聊天设置
  const updateChatSettings = async (values: any) => {
    try {
      const updatedSettings = await chatService.updateChatSettings(values);
      setChatSettings(updatedSettings);
      setSettingsVisible(false);
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存设置失败');
      console.error('Update settings error:', error);
    }
  };

  // 自动刷新会话列表
  const startAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    
    refreshIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // 减少刷新间隔到10秒，更频繁地更新
      if (now - lastRefreshTime > 10000) {
        loadConversations();
        setLastRefreshTime(now);
      }
    }, 2000); // 每2秒检查一次
  };

  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  useEffect(() => {
    loadConversations();
    loadChatSettings();
    loadAIConfig();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
    };
  }, []);

  // 在发送消息或创建新会话时更新刷新时间和重新加载消息
  useEffect(() => {
    setLastRefreshTime(Date.now());
    
    // 如果当前有会话，重新加载消息确保最新状态
    if (currentConversation?.id) {
      loadMessages(currentConversation.id);
    }
  }, [currentConversation?.id]);
  
  // 监听消息变化，更新时间戳
  useEffect(() => {
    setLastRefreshTime(Date.now());
  }, [messages.length]);

  const conversationMenuItems = (conversation: Conversation) => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑标题',
      onClick: () => {
        setEditingConversation(conversation);
        editForm.setFieldsValue({ title: conversation.title });
        setEditTitleModal(true);
      }
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除会话',
      danger: true,
      onClick: () => {
        Modal.confirm({
          title: '确认删除',
          content: '确定要删除这个会话吗？删除后无法恢复。',
          okText: '删除',
          cancelText: '取消',
          okType: 'danger',
          onOk: () => deleteConversation(conversation.id)
        });
      }
    }
  ];

  // 获取AI模型头像颜色
  const getAIAvatarColor = (modelProvider?: string) => {
    const colors: Record<string, string> = {
      'SiliconFlow': '#ff6b35',
      'OpenAI': '#10a37f',
      'Claude': '#d97706',
      'Gemini': '#4285f4',
      '通义千问': '#7c3aed',
      'FreeGPT': '#06b6d4',
      'default': '#52c41a'
    };
    return colors[modelProvider || 'default'] || colors.default;
  };

  // 获取AI模型头像文字
  const getAIAvatarText = (modelName?: string, modelProvider?: string) => {
    if (modelName) {
      // 提取模型名称的关键字母
      if (modelName.includes('GPT')) return 'GPT';
      if (modelName.includes('Claude')) return 'C';
      if (modelName.includes('Gemini')) return 'G';
      if (modelName.includes('Qwen')) return 'Q';
      if (modelName.includes('DeepSeek')) return 'DS';
      // 使用前两个字符
      return modelName.substring(0, 2).toUpperCase();
    }
    return 'AI';
  };

  const renderMessage = (msg: ChatMessage) => (
    <div
      key={msg.id}
      style={{
        display: 'flex',
        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
        marginBottom: 16
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          alignItems: 'flex-start',
          maxWidth: '80%'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            size="small"
            style={{
              backgroundColor: msg.role === 'user' ? '#1890ff' : getAIAvatarColor(msg.model_provider),
              margin: msg.role === 'user' ? '0 0 0 8px' : '0 8px 0 0',
              flexShrink: 0,
              fontWeight: 'bold',
              fontSize: '10px'
            }}
          >
            {msg.role === 'user' ? <UserOutlined /> : getAIAvatarText(msg.model_name, msg.model_provider)}
          </Avatar>
          {/* AI消息显示模型信息 */}
          {msg.role === 'assistant' && msg.model_name && (
            <div
              style={{
                fontSize: '9px',
                color: '#999',
                marginTop: '2px',
                textAlign: 'center',
                lineHeight: '1.2',
                maxWidth: '60px',
                wordBreak: 'break-all'
              }}
            >
              {msg.model_name}
            </div>
          )}
        </div>
        
        <div
          style={{
            background: msg.role === 'user' ? '#1890ff' : '#ffffff',
            color: msg.role === 'user' ? 'white' : '#333',
            padding: msg.role === 'user' ? '8px 12px' : '12px 16px',
            borderRadius: '12px',
            maxWidth: '100%',
            wordBreak: 'break-word',
            border: msg.role === 'assistant' ? '1px solid #e8e8e8' : 'none',
            boxShadow: msg.role === 'assistant' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          {/* AI消息头部信息 */}
          {msg.role === 'assistant' && (msg.model_provider || msg.model_name) && (
            <div
              style={{
                fontSize: '11px',
                color: '#666',
                marginBottom: '8px',
                borderBottom: '1px solid #f0f0f0',
                paddingBottom: '4px'
              }}
            >
              {msg.model_provider && (
                <span style={{ 
                  backgroundColor: getAIAvatarColor(msg.model_provider),
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  marginRight: '6px'
                }}>
                  {msg.model_provider}
                </span>
              )}
              {msg.model_name && (
                <span style={{ color: '#999' }}>
                  {msg.model_name}
                </span>
              )}
            </div>
          )}
          
          {/* 显示思考过程（仅对AI消息） */}
          {msg.role === 'assistant' && msg.thinking && (
            <ThinkingProcess thinking={msg.thinking} style={{ marginBottom: '8px' }} />
          )}
          
          {/* 消息内容 */}
          <div>
            {msg.role === 'user' ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
            ) : (
              <MarkdownMessage content={msg.content} />
            )}
          </div>
          
          <div
            style={{
              fontSize: '11px',
              opacity: 0.7,
              marginTop: '4px',
              textAlign: 'right',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>
              {msg.token_count && msg.role === 'assistant' && (
                <span style={{ marginRight: '8px' }}>
                  {msg.token_count} tokens
                </span>
              )}
            </span>
            <span>
              {moment(msg.timestamp).format('HH:mm')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ height: 'calc(100vh - 64px)', background: '#fff' }}>
      <Layout style={{ height: '100%' }}>
        {/* 会话侧边栏 */}
        <Sider
          width={300}
          collapsed={siderCollapsed}
          collapsedWidth={0}
          style={{
            background: '#fafafa',
            borderRight: '1px solid #e8e8e8'
          }}
        >
          <div style={{ padding: '16px' }}>
            <Row gutter={8}>
              <Col flex={1}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  block
                  onClick={() => setNewConversationModal(true)}
                >
                  新建会话
                </Button>
              </Col>
              <Col>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setSettingsVisible(true)}
                />
              </Col>
            </Row>
          </div>

          <div style={{ padding: '0 16px 16px' }}>
            <Divider style={{ margin: '0 0 16px 0' }} />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              会话历史
            </Text>
          </div>

          <List
            loading={loading}
            dataSource={conversations}
            locale={{ emptyText: <Empty description="暂无会话" /> }}
            renderItem={(conversation) => (
              <List.Item
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  background: currentConversation?.id === conversation.id ? '#e6f7ff' : 'transparent',
                  borderLeft: currentConversation?.id === conversation.id ? '3px solid #1890ff' : '3px solid transparent'
                }}
                onClick={() => selectConversation(conversation)}
                actions={[
                  <Dropdown
                    menu={{ items: conversationMenuItems(conversation) }}
                    trigger={['click']}
                  >
                    <Button type="text" size="small" icon={<MoreOutlined />} />
                  </Dropdown>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Text ellipsis style={{ fontSize: '14px' }}>
                      {conversation.title}
                    </Text>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {conversation.message_count || 0} 条消息
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {moment(conversation.updated_at).fromNow()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </Sider>

        {/* 聊天主界面 */}
        <Layout>
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {siderCollapsed && (
                <Button
                  type="text"
                  icon={<MenuOutlined />}
                  onClick={() => setSiderCollapsed(false)}
                  style={{ marginRight: 16 }}
                />
              )}
              <Title level={4} style={{ margin: 0 }}>
                {currentConversation ? currentConversation.title : 'AI 聊天助手'}
              </Title>
            </div>
            
            {!siderCollapsed && (
              <Button
                type="text"
                onClick={() => setSiderCollapsed(true)}
                style={{ opacity: 0.6 }}
              >
                收起
              </Button>
            )}
          </div>

          <Content
            style={{
              flex: 1,
              padding: '24px',
              overflow: 'auto',
              background: '#fafafa'
            }}
          >
            {currentConversation ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 消息列表 */}
                <div style={{ flex: 1, overflow: 'auto', marginBottom: 16 }}>
                  {messages.length === 0 ? (
                    <Empty
                      description="开始新的对话吧"
                      style={{ marginTop: '20%' }}
                    />
                  ) : (
                    <>
                      {messages.map(renderMessage)}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* 输入框 */}
                <Card
                  size="small"
                  style={{ background: '#fff', borderRadius: '12px' }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <TextArea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="输入您的消息..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={sendMessage}
                      loading={sendingMessage}
                      disabled={!inputMessage.trim() || sendingMessage}
                    >
                      发送
                    </Button>
                  </div>
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                    按 Enter 发送，Shift + Enter 换行
                  </div>
                </Card>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginTop: '20%' }}>
                <Empty
                  description={
                    <div>
                      <p>选择一个会话开始聊天</p>
                      <p>或者创建一个新的会话</p>
                    </div>
                  }
                >
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setNewConversationModal(true)}
                  >
                    创建新会话
                  </Button>
                </Empty>
              </div>
            )}
          </Content>
        </Layout>
      </Layout>

      {/* 新建会话模态框 */}
      <Modal
        title="创建新会话"
        open={newConversationModal}
        onCancel={() => {
          setNewConversationModal(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={createNewConversation} layout="vertical">
          <Form.Item
            name="title"
            label="会话标题"
            rules={[{ required: true, message: '请输入会话标题' }]}
          >
            <Input placeholder="输入会话标题" />
          </Form.Item>
          <Form.Item
            name="first_message"
            label="首条消息（可选）"
          >
            <TextArea
              rows={3}
              placeholder="输入第一条消息（可选）"
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setNewConversationModal(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑标题模态框 */}
      <Modal
        title="编辑会话标题"
        open={editTitleModal}
        onCancel={() => {
          setEditTitleModal(false);
          setEditingConversation(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} onFinish={updateConversationTitle} layout="vertical">
          <Form.Item
            name="title"
            label="会话标题"
            rules={[{ required: true, message: '请输入会话标题' }]}
          >
            <Input placeholder="输入新的会话标题" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setEditTitleModal(false);
                setEditingConversation(null);
                editForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置抽屉 */}
      <Drawer
        title="聊天设置"
        placement="right"
        open={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        width={400}
      >
        {chatSettings && (
          <Form
            form={settingsForm}
            layout="vertical"
            onFinish={updateChatSettings}
            initialValues={chatSettings}
          >
            <Form.Item
              name="default_provider"
              label="AI提供商"
            >
              <Select 
                placeholder="选择AI提供商"
                onChange={(providerId) => {
                  const providerModels = (models || []).filter(m => m.provider === providerId);
                  if (providerModels.length > 0) {
                    settingsForm.setFieldValue('default_model', providerModels[0].id);
                  }
                }}
                allowClear
              >
                {(providers || []).map(provider => (
                  <Select.Option key={provider.id} value={provider.id}>
                    {provider.name} ({provider.provider_type})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="default_model"
              label="AI模型"
            >
              <Select 
                placeholder="选择AI模型"
                allowClear
                showSearch
                size="large"
                dropdownStyle={{ 
                  maxHeight: '400px',
                  overflow: 'auto'
                }}
                optionLabelProp="label"
                filterOption={(input, option) => {
                  if (!option?.value) return false;
                  const model = (models || []).find(m => m.id === option.value);
                  if (!model) return false;
                  const searchText = input.toLowerCase();
                  return !!(
                    model.model_name.toLowerCase().includes(searchText) ||
                    model.model_id.toLowerCase().includes(searchText) ||
                    (model.description && model.description.toLowerCase().includes(searchText))
                  );
                }}
                optionFilterProp="children"
              >
                {(models || [])
                  .filter(model => {
                    const selectedProvider = settingsForm.getFieldValue('default_provider');
                    return !selectedProvider || model.provider === selectedProvider;
                  })
                  .map(model => (
                    <Select.Option 
                      key={model.id} 
                      value={model.id}
                      label={model.model_name}
                    >
                      <div style={{ padding: '4px 0' }}>
                        <div style={{ 
                          fontWeight: 'bold', 
                          fontSize: '14px',
                          marginBottom: '2px',
                          color: '#1890ff'
                        }}>
                          {model.model_name}
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#666',
                          marginBottom: '4px',
                          wordBreak: 'break-all'
                        }}>
                          ID: {model.model_id}
                        </div>
                        {model.description && (
                          <div style={{ 
                            fontSize: '11px', 
                            color: '#999',
                            fontStyle: 'italic'
                          }}>
                            {model.description}
                          </div>
                        )}
                        <div style={{ marginTop: '4px' }}>
                          {model.support_functions && (
                            <span style={{ 
                              fontSize: '10px', 
                              background: '#f6ffed', 
                              border: '1px solid #b7eb8f',
                              color: '#52c41a',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              marginRight: '4px'
                            }}>
                              函数
                            </span>
                          )}
                          {model.support_vision && (
                            <span style={{ 
                              fontSize: '10px', 
                              background: '#f0f5ff', 
                              border: '1px solid #adc6ff',
                              color: '#1890ff',
                              padding: '1px 4px',
                              borderRadius: '2px',
                              marginRight: '4px'
                            }}>
                              视觉
                            </span>
                          )}
                          <span style={{ 
                            fontSize: '10px', 
                            color: '#999'
                          }}>
                            最大Token: {model.max_tokens?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </Select.Option>
                  ))
                }
              </Select>
            </Form.Item>

            <Form.Item
              name="max_tokens"
              label="最大Token数"
            >
              <Slider
                min={512}
                max={4096}
                step={128}
                marks={{
                  512: '512',
                  2048: '2048',
                  4096: '4096'
                }}
              />
            </Form.Item>

            <Form.Item
              name="temperature"
              label="创造性"
              help="数值越高，回答越有创造性"
            >
              <Slider
                min={0}
                max={1}
                step={0.1}
                marks={{
                  0: '保守',
                  0.5: '平衡',
                  1: '创新'
                }}
              />
            </Form.Item>

            <Form.Item
              name="system_prompt"
              label="系统提示词"
              help="定义AI助手的行为和角色"
            >
              <TextArea
                rows={4}
                placeholder="输入系统提示词"
              />
            </Form.Item>

            <Form.Item style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setSettingsVisible(false)}>
                  取消
                </Button>
                <Button type="primary" htmlType="submit">
                  保存设置
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Drawer>
    </div>
  );
};

export default Chat;
