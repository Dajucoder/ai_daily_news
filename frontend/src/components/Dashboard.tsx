import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Statistic, Button, message, Progress, Typography, Space, Select, Spin } from 'antd';
import { 
  FileTextOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
  TrophyOutlined,
  PoweroffOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { NewsStats, FetchStatus, AgentStatus, ModelInfo } from '../types';
import { NewsService } from '../services/newsService';
import agentService from '../services/agentService';

const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  
  // Agent model state
  const [allModels, setAllModels] = useState<ModelInfo[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
  const [currentModel, setCurrentModel] = useState<string | undefined>(undefined);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelChanging, setIsModelChanging] = useState(false);

  const loadStats = async () => {
    try {
      const data = await NewsService.getStats();
      setStats(data);
    } catch (error) {
      message.error('获取统计信息失败');
    }
  };

  const loadFetchStatus = async () => {
    try {
      const data = await NewsService.getFetchStatus();
      setFetchStatus(data);
    } catch (error) {
      console.error('获取状态失败:', error);
    }
  };

  const loadAgentStatus = async () => {
    try {
      const data = await NewsService.getAgentStatus();
      setAgentStatus(data);
      return data.available;
    } catch (error) {
      console.error('获取AI代理状态失败:', error);
      setAgentStatus({ available: false, status: 'error', is_fetching: false, progress: 0, message: '服务连接失败' });
      return false;
    }
  };

  const loadAvailableModels = useCallback(async () => {
    setIsModelLoading(true);
    try {
      const response = await agentService.getAvailableModels();
      const models = response.models || [];
      setAllModels(models);
      setFilteredModels(models);
      const uniqueProviders = Array.from(new Set(models.map(m => m.provider_name)));
      setProviders(uniqueProviders);
    } catch (error) {
      message.error('获取可用模型列表失败');
      setAllModels([]);
      setFilteredModels([]);
    } finally {
      setIsModelLoading(false);
    }
  }, []);

  const loadCurrentModel = useCallback(async () => {
    try {
      const model = await agentService.getCurrentModel();
      if (model) {
        setCurrentModel(model.model_id);
        setSelectedProvider(model.provider_name);
        const filtered = allModels.filter(m => m.provider_name === model.provider_name);
        setFilteredModels(filtered.length > 0 ? filtered : allModels);
      }
    } catch (error) {
      console.log('无法获取当前模型，可能尚未选择。');
      setCurrentModel(undefined);
    }
  }, [allModels]);
  
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const filtered = allModels.filter(m => m.provider_name === provider);
    setFilteredModels(filtered);
    setCurrentModel(undefined); // Reset model selection
  };

  const handleModelChange = async (modelId: string) => {
    setIsModelChanging(true);
    try {
      await agentService.selectModel(modelId);
      message.success(`模型已切换为 ${modelId}`);
      await loadCurrentModel();
      await loadAgentStatus();
    } catch (error) {
      message.error('切换模型失败');
    } finally {
      setIsModelChanging(false);
    }
  };

  const handleFetchNews = async () => {
    try {
      await NewsService.fetchNews({ force_refresh: false, max_news_count: 10 });
      message.success('开始获取新闻');
      
      let pollCount = 0;
      const maxPolls = 120;
      
      const interval = setInterval(async () => {
        try {
          pollCount++;
          const status = await NewsService.getFetchStatus();
          setFetchStatus(status);
          
          if (!status.is_fetching || pollCount >= maxPolls) {
            clearInterval(interval);
            if (pollCount >= maxPolls) {
              message.warning('获取超时，请检查服务状态');
            } else if (status.progress === 100) {
              message.success(status.message || '新闻获取完成');
            } else if (status.last_error) {
              message.error(`获取失败: ${status.last_error}`);
            }
            loadStats();
          }
        } catch (error) {
          console.error('轮询状态失败:', error);
          if (pollCount >= maxPolls) {
            clearInterval(interval);
            message.error('无法获取状态，请检查服务连接');
          }
        }
      }, 1000);
      
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取新闻失败');
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      const isAgentAvailable = await loadAgentStatus();
      if (isAgentAvailable) {
        await Promise.all([
          loadStats(), 
          loadFetchStatus(),
          loadAvailableModels(),
        ]);
      }
    };
    loadInitialData();
  }, [loadAvailableModels]);

  useEffect(() => {
    if (allModels.length > 0) {
      loadCurrentModel();
    }
  }, [allModels, loadCurrentModel]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await Promise.all([loadStats(), loadFetchStatus(), loadAgentStatus()]);
      } catch (error) {
        console.error('自动刷新失败:', error);
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return '#ff4d4f';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#1890ff';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>AI新闻系统仪表板</Title>
      
      <Row gutter={[24, 24]}>
        {/* First Column */}
        <Col xs={24} md={12} lg={8}>
          <Card title="新闻获取" extra={
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleFetchNews}
              disabled={fetchStatus?.is_fetching || !agentStatus?.available}
              loading={fetchStatus?.is_fetching}
            >
              {fetchStatus?.is_fetching ? '获取中...' : '获取新闻'}
            </Button>
          }>
            {fetchStatus?.is_fetching ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                <Progress 
                  percent={fetchStatus.progress} 
                  status={fetchStatus.progress === 100 ? 'success' : 'active'}
                />
                <Text>{fetchStatus.message}</Text>
              </Space>
            ) : (
              <Text>点击按钮开始获取最新AI新闻</Text>
            )}
          </Card>
        </Col>

        {/* Second Column */}
        <Col xs={24} md={12} lg={16}>
          <Card title="AI代理状态">
            <Spin spinning={isModelChanging} tip="正在切换模型...">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Row align="middle">
                  <Col span={6}><Text strong>服务状态:</Text></Col>
                  <Col span={18}>
                    <Text strong style={{ color: agentStatus?.available ? '#52c41a' : '#ff4d4f' }}>
                      {agentStatus?.available ? <CheckCircleOutlined /> : <PoweroffOutlined />}
                      {agentStatus?.available ? ' 在线' : ' 离线'}
                    </Text>
                  </Col>
                </Row>

                {agentStatus?.available && (
                  <>
                    <Row align="middle">
                      <Col span={6}><Text strong>模型提供商:</Text></Col>
                      <Col span={18}>
                        <Select
                          value={selectedProvider}
                          style={{ width: '100%' }}
                          onChange={handleProviderChange}
                          loading={isModelLoading}
                          disabled={isModelChanging || !agentStatus?.available}
                          placeholder="请选择提供商"
                        >
                          {providers.map(provider => (
                            <Option key={provider} value={provider}>{provider}</Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                    <Row align="middle">
                      <Col span={6}><Text strong>当前模型:</Text></Col>
                      <Col span={18}>
                        <Select
                          showSearch
                          value={currentModel}
                          style={{ width: '100%' }}
                          onChange={handleModelChange}
                          loading={isModelLoading}
                          disabled={isModelChanging || !agentStatus?.available || !selectedProvider}
                          placeholder="请选择模型"
                          filterOption={(input, option) =>
                            (option?.children?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {filteredModels.map(model => (
                            <Option key={model.model_id} value={model.model_id}>
                              {model.model_name}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                    </Row>
                  </>
                )}
                <Row align="middle">
                  <Col span={6}><Text strong>状态信息:</Text></Col>
                  <Col span={18}>
                    <Text type="secondary">{agentStatus?.last_message || agentStatus?.message || '准备就绪'}</Text>
                  </Col>
                </Row>
              </Space>
            </Spin>
          </Card>
        </Col>

        {/* Third Column for Stats */}
        <Col xs={24} lg={24}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic title="总新闻数" value={stats?.total_count || 0} prefix={<FileTextOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic title="今日新闻" value={stats?.today_count || 0} prefix={<CalendarOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic title="本周新闻" value={stats?.week_count || 0} prefix={<ClockCircleOutlined />} />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small">
                <Statistic title="RSS源数量" value={stats?.source_stats?.length || 0} prefix={<TrophyOutlined />} />
              </Card>
            </Col>
          </Row>
        </Col>

        {/* Fourth Column for Importance */}
        <Col xs={24} lg={24}>
          <Card title="重要程度分布">
            <Row gutter={[16, 16]}>
              {stats?.importance_stats && stats.importance_stats.map((item) => (
                <Col xs={24} sm={8} key={item.importance}>
                  <Card size="small">
                    <Statistic
                      title={item.importance === 'high' ? '高' : item.importance === 'medium' ? '中' : '低'}
                      value={item.count}
                      valueStyle={{ color: getImportanceColor(item.importance) }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;