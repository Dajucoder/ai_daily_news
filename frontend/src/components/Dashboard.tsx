import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message, Progress, Typography, Space } from 'antd';
import { 
  FileTextOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { NewsStats, FetchStatus, AgentStatus } from '../types';
import { NewsService } from '../services/newsService';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [loading, setLoading] = useState(false);

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
    } catch (error) {
      console.error('获取AI代理状态失败:', error);
    }
  };

  const handleFetchNews = async () => {
    setLoading(true);
    try {
      await NewsService.fetchNews({ force_refresh: false, max_news_count: 10 });
      message.success('开始获取新闻');
      
      // 开始轮询状态
      let pollCount = 0;
      const maxPolls = 120; // 最多轮询2分钟 (120 * 1秒)
      
      const interval = setInterval(async () => {
        try {
          pollCount++;
          const status = await NewsService.getFetchStatus();
          setFetchStatus(status);
          
          // 检查是否完成或超时
          if (!status.is_fetching || pollCount >= maxPolls) {
            clearInterval(interval);
            setLoading(false);
            
            if (pollCount >= maxPolls) {
              message.warning('获取超时，请检查服务状态');
            } else if (status.progress === 100) {
              message.success(status.message || '新闻获取完成');
            } else if (status.last_error) {
              message.error(`获取失败: ${status.last_error}`);
            }
            
            // 重新加载统计信息
            loadStats();
          }
        } catch (error) {
          console.error('轮询状态失败:', error);
          // 轮询出错时不立即停止，给几次重试机会
          if (pollCount >= maxPolls) {
            clearInterval(interval);
            setLoading(false);
            message.error('无法获取状态，请检查服务连接');
          }
        }
      }, 1000);
      
    } catch (error: any) {
      setLoading(false);
      message.error(error.response?.data?.error || '获取新闻失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadFetchStatus(), loadAgentStatus()]);
      setLoading(false);
    };
    
    // 初始加载
    loadData();
    
    // 设置定时器，每5秒自动刷新状态
    const interval = setInterval(async () => {
      try {
        // 只刷新状态数据，不显示loading
        await Promise.all([loadStats(), loadFetchStatus(), loadAgentStatus()]);
      } catch (error) {
        console.error('自动刷新失败:', error);
      }
    }, 5000);
    
    // 清理定时器
    return () => {
      clearInterval(interval);
    };
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
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>AI新闻系统仪表板</Title>
        <Text type="secondary">实时监控AI新闻获取和统计信息</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总新闻数"
              value={stats?.total_count || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新闻"
              value={stats?.today_count || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本周新闻"
              value={stats?.week_count || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="RSS源数量"
              value={stats?.source_stats?.length || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 获取状态和操作 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="新闻获取" extra={
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleFetchNews}
              disabled={fetchStatus?.is_fetching}
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
              <div>
                <Text>点击按钮开始获取最新AI新闻</Text>
                <br />
                <Text type="secondary">
                  系统会自动从配置的RSS源获取最新新闻
                </Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="AI代理状态">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>服务状态:</Text>
                <Text strong style={{ 
                  color: agentStatus?.available ? '#52c41a' : '#ff4d4f' 
                }}>
                  {agentStatus?.available ? '✅ 在线' : '❌ 离线'}
                </Text>
              </div>
              {agentStatus?.is_fetching && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text>抓取进度:</Text>
                    <Text strong>{agentStatus.progress || 0}%</Text>
                  </div>
                  <Progress 
                    percent={agentStatus.progress || 0} 
                    size="small"
                    status="active"
                  />
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>状态信息:</Text>
                <Text style={{ fontSize: '12px', color: '#666' }}>
                  {agentStatus?.last_message || agentStatus?.message || '准备就绪'}
                </Text>
              </div>
              {!agentStatus?.available && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  请确保AI新闻代理服务正在运行 (端口5001)
                </Text>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 重要程度统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
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