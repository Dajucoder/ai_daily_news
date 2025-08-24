import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, message, Progress, Typography, Space } from 'antd';
import { 
  FileTextOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined,
  ReloadOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { NewsStats, FetchStatus } from '../types';
import { NewsService } from '../services/newsService';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<NewsStats | null>(null);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus | null>(null);
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

  const handleFetchNews = async () => {
    try {
      await NewsService.fetchNews({ force_refresh: false, max_news_count: 5 });
      message.success('开始获取新闻');
      
      // 开始轮询状态
      const interval = setInterval(async () => {
        const status = await NewsService.getFetchStatus();
        setFetchStatus(status);
        
        if (!status.is_fetching) {
          clearInterval(interval);
          loadStats(); // 重新加载统计信息
          if (status.progress === 100) {
            message.success(status.message);
          }
        }
      }, 1000);
      
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取新闻失败');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadStats(), loadFetchStatus()]);
      setLoading(false);
    };
    
    loadData();
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
              value={stats?.total_news || 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日新闻"
              value={stats?.today_news || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本周新闻"
              value={stats?.week_news || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="本月新闻"
              value={stats?.month_news || 0}
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
                  最后获取时间: {stats?.last_fetch_time ? 
                    new Date(stats.last_fetch_time).toLocaleString() : '暂无'
                  }
                </Text>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="分类统计">
            <Space direction="vertical" style={{ width: '100%' }}>
              {stats?.category_stats && Object.entries(stats.category_stats).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>{key}</Text>
                  <Text strong>{value}</Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 重要程度统计 */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="重要程度分布">
            <Row gutter={[16, 16]}>
              {stats?.importance_stats && Object.entries(stats.importance_stats).map(([key, value]) => (
                <Col xs={24} sm={8} key={key}>
                  <Card size="small">
                    <Statistic
                      title={key === 'high' ? '高' : key === 'medium' ? '中' : '低'}
                      value={value}
                      valueStyle={{ color: getImportanceColor(key) }}
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