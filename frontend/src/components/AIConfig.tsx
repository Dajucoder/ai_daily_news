import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  List,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Typography,
  Popconfirm,
  Tag,
  message,
  Divider,
  Tabs,
  Badge,
  Alert,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ApiOutlined,
  RobotOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  EyeOutlined
} from '@ant-design/icons';
import aiConfigService from '../services/aiConfigService';
import { AIProvider, AIModel, AIProviderForm, AIModelForm } from '../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AIConfig: React.FC = () => {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modelModalVisible, setModelModalVisible] = useState(false);
  const [currentProvider, setCurrentProvider] = useState<AIProvider | null>(null);
  const [currentModel, setCurrentModel] = useState<AIModel | null>(null);
  const [activeTab, setActiveTab] = useState('providers');
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [detectingModels, setDetectingModels] = useState(false);
  
  const [providerForm] = Form.useForm();
  const [modelForm] = Form.useForm();

  useEffect(() => {
    loadProviders();
    loadModels();
  }, []);

  const loadProviders = async () => {
    try {
      setLoading(true);
      const data = await aiConfigService.getProviders();
      setProviders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('加载AI提供商失败:', error);
      setProviders([]);
      message.error('加载AI提供商失败');
    } finally {
      setLoading(false);
    }
  };

  const loadModels = async (providerId?: number) => {
    try {
      const data = await aiConfigService.getModels(providerId);
      setModels(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('加载AI模型失败:', error);
      setModels([]);
      message.error('加载AI模型失败');
    }
  };

  // 提供商相关操作
  const handleCreateProvider = () => {
    setCurrentProvider(null);
    providerForm.resetFields();
    providerForm.setFieldsValue({
      is_active: true,
      is_default: false,
      provider_type: 'custom'
    });
    setModalVisible(true);
  };

  const handleEditProvider = (provider: AIProvider) => {
    setCurrentProvider(provider);
    providerForm.setFieldsValue({
      ...provider,
      api_key: '' // 出于安全考虑，不显示现有密钥
    });
    setModalVisible(true);
  };

  const handleDeleteProvider = async (id: number) => {
    try {
      await aiConfigService.deleteProvider(id);
      message.success('删除成功');
      loadProviders();
      loadModels();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleProviderSubmit = async (values: AIProviderForm) => {
    try {
      setLoading(true);
      if (currentProvider) {
        // 编辑时，如果API密钥为空，则不更新
        const updateData: Partial<AIProviderForm> = { ...values };
        if (!updateData.api_key) {
          const { api_key, ...dataWithoutApiKey } = updateData;
          await aiConfigService.updateProvider(currentProvider.id, dataWithoutApiKey);
        } else {
          await aiConfigService.updateProvider(currentProvider.id, updateData);
        }
        message.success('更新成功');
      } else {
        await aiConfigService.createProvider(values);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadProviders();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 测试连接
  const handleTestConnection = async () => {
    try {
      const values = await providerForm.validateFields(['api_key', 'api_base_url']);
      setTestingConnection(true);
      
      const result = await aiConfigService.testConnection({
        api_key: values.api_key,
        api_base_url: values.api_base_url
      });
      
      if (result.success) {
        message.success(`连接测试成功！使用模型: ${result.model_used}`);
      } else {
        message.error(result.message);
      }
    } catch (error: any) {
      message.error(error.message || '连接测试失败');
    } finally {
      setTestingConnection(false);
    }
  };

  // 检测模型
  const handleDetectModels = async (providerId: number) => {
    try {
      setDetectingModels(true);
      const result = await aiConfigService.detectModels({ provider_id: providerId });
      
      if (result.success) {
        message.success(`检测到 ${result.count} 个模型`);
        
        // 询问是否自动添加检测到的模型
        Modal.confirm({
          title: '自动添加模型',
          content: `检测到 ${result.count} 个可用模型，是否自动添加到系统中？`,
          onOk: async () => {
            let successCount = 0;
            for (const model of result.models) {
              try {
                await aiConfigService.createModel({
                  provider: providerId,
                  model_id: model.model_id,
                  model_name: model.model_name,
                  description: model.description,
                  max_tokens: 4096,
                  support_functions: false,
                  support_vision: false,
                  is_active: true
                });
                successCount++;
              } catch (error) {
                // 忽略重复模型错误
                console.log(`模型 ${model.model_id} 可能已存在`);
              }
            }
            message.success(`成功添加 ${successCount} 个模型`);
            loadModels();
          }
        });
      } else {
        message.error(result.message);
      }
    } catch (error: any) {
      message.error(error.message || '模型检测失败');
    } finally {
      setDetectingModels(false);
    }
  };

  // 模型相关操作
  const handleCreateModel = () => {
    if (!selectedProviderId) {
      message.warning('请先选择一个AI提供商');
      return;
    }
    setCurrentModel(null);
    modelForm.resetFields();
    modelForm.setFieldsValue({
      provider: selectedProviderId,
      max_tokens: 4096,
      support_functions: false,
      support_vision: false,
      is_active: true
    });
    setModelModalVisible(true);
  };

  const handleEditModel = (model: AIModel) => {
    setCurrentModel(model);
    modelForm.setFieldsValue(model);
    setModelModalVisible(true);
  };

  const handleDeleteModel = async (id: number) => {
    try {
      await aiConfigService.deleteModel(id);
      message.success('删除成功');
      loadModels();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleModelSubmit = async (values: AIModelForm) => {
    try {
      setLoading(true);
      if (currentModel) {
        await aiConfigService.updateModel(currentModel.id, values);
        message.success('更新成功');
      } else {
        await aiConfigService.createModel(values);
        message.success('创建成功');
      }
      setModelModalVisible(false);
      loadModels();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getProviderTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      openai: 'OpenAI',
      siliconflow: 'SiliconFlow',
      freegpt: 'FreeGPT',
      qwen: '通义千问',
      gemini: 'Gemini',
      claude: 'Claude',
      custom: '自定义'
    };
    return types[type] || type;
  };

  const renderProviderCard = (provider: AIProvider) => (
    <Card
      key={provider.id}
      size="small"
      className={`provider-card ${provider.is_default ? 'default-provider' : ''}`}
      style={{
        marginBottom: 12,
        border: provider.is_default ? '2px solid #1890ff' : '1px solid #d9d9d9'
      }}
      title={
        <Space>
          <ApiOutlined />
          <span>{provider.name}</span>
          {provider.is_default && <Tag color="blue">默认</Tag>}
          {!provider.is_active && <Tag color="red">已禁用</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Tooltip title="检测模型">
            <Button
              icon={<ThunderboltOutlined />}
              size="small"
              loading={detectingModels}
              onClick={() => handleDetectModels(provider.id)}
            />
          </Tooltip>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditProvider(provider)}
          />
          <Popconfirm
            title="确定要删除这个AI提供商吗？"
            description="删除后将同时删除其所有模型配置"
            onConfirm={() => handleDeleteProvider(provider.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">
          类型: {getProviderTypeLabel(provider.provider_type)}
        </Text>
        <Text type="secondary">
          API地址: {provider.api_base_url}
        </Text>
        <Text type="secondary">
          模型数量: <Badge count={provider.models_count} style={{ backgroundColor: '#52c41a' }} />
        </Text>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          创建时间: {new Date(provider.created_at).toLocaleString()}
        </Text>
      </Space>
    </Card>
  );

  const renderModelCard = (model: AIModel) => (
    <Card
      key={model.id}
      size="small"
      style={{ 
        marginBottom: 12, 
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        border: '1px solid #f0f0f0'
      }}
      title={
        <Space wrap>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span style={{ 
            wordBreak: 'break-word', 
            maxWidth: '300px',
            fontWeight: 'bold'
          }}>
            {model.model_name}
          </span>
          {!model.is_active && <Tag color="red">已禁用</Tag>}
        </Space>
      }
      extra={
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditModel(model)}
          />
          <Popconfirm
            title="确定要删除这个模型吗？"
            onConfirm={() => handleDeleteModel(model.id)}
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text type="secondary">提供商: {model.provider_name}</Text>
        <Text type="secondary" style={{ wordBreak: 'break-all' }}>
          模型ID: {model.model_id}
        </Text>
        <Text type="secondary">最大Token: {model.max_tokens?.toLocaleString()}</Text>
        {model.description && (
          <Text type="secondary" style={{ wordBreak: 'break-word' }}>
            {model.description}
          </Text>
        )}
        <Space wrap>
          {model.support_functions && <Tag color="green">支持函数</Tag>}
          {model.support_vision && <Tag color="blue">支持视觉</Tag>}
          {model.is_active ? (
            <Tag color="success">已启用</Tag>
          ) : (
            <Tag color="default">已禁用</Tag>
          )}
        </Space>
      </Space>
    </Card>
  );

  const filteredModels = selectedProviderId 
    ? models.filter(model => model.provider === selectedProviderId)
    : models;

  return (
    <div style={{ padding: '24px', background: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#1890ff', marginBottom: '8px' }}>
          <SettingOutlined style={{ marginRight: '8px' }} />
          AI配置管理
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>
          管理您的AI服务提供商和模型配置，支持多个API提供商同时使用
        </Paragraph>
      </div>

      <Alert
        message="使用说明"
        description="您可以添加多个AI服务提供商（如OpenAI、SiliconFlow等），为每个提供商配置不同的模型。系统会自动检测可用模型并帮助您快速配置。"
        type="info"
        showIcon
        style={{ 
          marginBottom: '24px',
          borderRadius: '8px',
          border: '1px solid #b3d8ff'
        }}
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        style={{ 
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <TabPane tab={
          <span>
            <ApiOutlined />
            AI提供商 ({providers.length})
          </span>
        } key="providers">
          <Card style={{ border: 'none', background: 'transparent' }}>
            <div style={{ marginBottom: '16px' }}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleCreateProvider}
                size="large"
                style={{ borderRadius: '8px' }}
              >
                添加AI提供商
              </Button>
            </div>
            
            <List
              loading={loading}
              dataSource={providers}
              renderItem={renderProviderCard}
              locale={{ emptyText: '暂无AI提供商配置' }}
            />
          </Card>
        </TabPane>

        <TabPane tab={
          <span>
            <RobotOutlined />
            AI模型 ({models.length})
          </span>
        } key="models">
          <Card>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateModel}
                >
                  添加模型
                </Button>
                <Select
                  placeholder="筛选提供商"
                  style={{ width: 200 }}
                  allowClear
                  showSearch
                  value={selectedProviderId}
                  onChange={setSelectedProviderId}
                  filterOption={(input, option) => {
                    if (!option?.value) return false;
                    const provider = providers.find(p => p.id === option.value);
                    if (!provider) return false;
                    const searchText = input.toLowerCase();
                    return !!(
                      provider.name.toLowerCase().includes(searchText) ||
                      provider.provider_type.toLowerCase().includes(searchText)
                    );
                  }}
                >
                  {providers.map(provider => (
                    <Option key={provider.id} value={provider.id}>
                      {provider.name} ({provider.provider_type})
                    </Option>
                  ))}
                </Select>
              </Space>
            </div>
            
            <List
              loading={loading}
              dataSource={filteredModels}
              renderItem={renderModelCard}
              locale={{ emptyText: '暂无AI模型配置' }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* AI提供商配置Modal */}
      <Modal
        title={currentProvider ? '编辑AI提供商' : '添加AI提供商'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={providerForm}
          layout="vertical"
          onFinish={handleProviderSubmit}
        >
          <Form.Item
            label="提供商名称"
            name="name"
            rules={[{ required: true, message: '请输入提供商名称' }]}
          >
            <Input placeholder="如：我的OpenAI配置" />
          </Form.Item>

          <Form.Item
            label="提供商类型"
            name="provider_type"
            rules={[{ required: true, message: '请选择提供商类型' }]}
          >
            <Select placeholder="选择提供商类型">
              <Option value="openai">OpenAI</Option>
              <Option value="siliconflow">SiliconFlow</Option>
              <Option value="freegpt">FreeGPT</Option>
              <Option value="qwen">通义千问</Option>
              <Option value="gemini">Gemini</Option>
              <Option value="claude">Claude</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="API密钥"
            name="api_key"
            rules={currentProvider ? [] : [{ required: true, message: '请输入API密钥' }]}
            help={currentProvider ? '留空表示不修改现有密钥' : ''}
          >
            <Input.Password placeholder="输入您的API密钥" />
          </Form.Item>

          <Form.Item
            label="API基础地址"
            name="api_base_url"
            rules={[
              { required: true, message: '请输入API基础地址' },
              { type: 'url', message: '请输入有效的URL' }
            ]}
          >
            <Input placeholder="如：https://api.openai.com/v1" />
          </Form.Item>

          <Form.Item label="配置选项">
            <Space direction="vertical">
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
              <Text type="secondary">启用此AI提供商</Text>
              
              <Form.Item name="is_default" valuePropName="checked" noStyle>
                <Switch checkedChildren="默认" unCheckedChildren="非默认" />
              </Form.Item>
              <Text type="secondary">设置为默认AI提供商</Text>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {currentProvider ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              {!currentProvider && (
                <Button
                  icon={<CheckCircleOutlined />}
                  loading={testingConnection}
                  onClick={handleTestConnection}
                >
                  测试连接
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* AI模型配置Modal */}
      <Modal
        title={currentModel ? '编辑AI模型' : '添加AI模型'}
        open={modelModalVisible}
        onCancel={() => setModelModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={modelForm}
          layout="vertical"
          onFinish={handleModelSubmit}
        >
          <Form.Item
            label="AI提供商"
            name="provider"
            rules={[{ required: true, message: '请选择AI提供商' }]}
          >
            <Select 
              placeholder="选择AI提供商" 
              disabled={!!currentModel}
              showSearch
              filterOption={(input, option) => {
                if (!option?.value) return false;
                const provider = (providers || []).find(p => p.id === option.value);
                if (!provider) return false;
                const searchText = input.toLowerCase();
                return !!(
                  provider.name.toLowerCase().includes(searchText) ||
                  provider.provider_type.toLowerCase().includes(searchText)
                );
              }}
            >
              {(providers || []).map(provider => (
                <Option key={provider.id} value={provider.id}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{provider.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {provider.provider_type} - {provider.api_base_url}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="模型ID"
            name="model_id"
            rules={[{ required: true, message: '请输入模型ID' }]}
          >
            <Input placeholder="如：gpt-3.5-turbo" />
          </Form.Item>

          <Form.Item
            label="模型显示名称"
            name="model_name"
            rules={[{ required: true, message: '请输入模型显示名称' }]}
          >
            <Input placeholder="如：GPT-3.5 Turbo" />
          </Form.Item>

          <Form.Item label="模型描述" name="description">
            <Input.TextArea rows={2} placeholder="可选的模型描述信息" />
          </Form.Item>

          <Form.Item
            label="最大Token数"
            name="max_tokens"
            rules={[{ required: true, message: '请输入最大Token数' }]}
          >
            <Input type="number" placeholder="4096" />
          </Form.Item>

          <Form.Item label="功能支持">
            <Space direction="vertical">
              <Form.Item name="support_functions" valuePropName="checked" noStyle>
                <Switch checkedChildren="支持" unCheckedChildren="不支持" />
              </Form.Item>
              <Text type="secondary">支持函数调用</Text>
              
              <Form.Item name="support_vision" valuePropName="checked" noStyle>
                <Switch checkedChildren="支持" unCheckedChildren="不支持" />
              </Form.Item>
              <Text type="secondary">支持图像理解</Text>
              
              <Form.Item name="is_active" valuePropName="checked" noStyle>
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
              <Text type="secondary">启用此模型</Text>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {currentModel ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModelModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AIConfig;
