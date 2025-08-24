import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Typography,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  message,
  Tooltip
} from 'antd';
import {
  StarOutlined,
  EyeOutlined,
  TrophyOutlined,
  FireOutlined,
  ThunderboltOutlined,
  HeartOutlined,
  BookOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { NewsItem, CATEGORY_LABELS, IMPORTANCE_LABELS } from '../types';
import { NewsService } from '../services/newsService';

const { Title, Text, Paragraph } = Typography;

interface RecommendationData {
  trending_news: NewsItem[];
  category_recommendations: Record<string, NewsItem[]>;
  importance_stats: Record<string, number>;
  recent_highlights: NewsItem[];
}

const NewsRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('tech_breakthrough');

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // 模拟智能推荐数据
      const [newsResponse, statsResponse] = await Promise.all([
        NewsService.getNews({ page_size: 20, days: 7 }),
        NewsService.getStats()
      ]);

      const allNews = newsResponse.results || [];
      
      // 生成推荐数据
      const trendingNews = allNews
        .filter(item => item.importance === 'high')
        .slice(0, 5);

      const categoryRecommendations: Record<string, NewsItem[]> = {};
      Object.keys(CATEGORY_LABELS).forEach(category => {
        categoryRecommendations[category] = allNews
          .filter(item => item.category === category)
          .slice(0, 3);
      });

      const recentHighlights = allNews
        .filter(item => new Date(item.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .slice(0, 6);

      setRecommendations({
        trending_news: trendingNews,
        category_recommendations: categoryRecommendations,
        importance_stats: statsResponse.importance_stats || {},
        recent_highlights: recentHighlights
      });
    } catch (error) {
      console.error('加载推荐内容失败:', error);
      message.error('加载推荐内容失败');
    } finally {
      setLoading(false);
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      tech_breakthrough: <ThunderboltOutlined style={{ color: '#722ed1' }} />,
      product_release: <StarOutlined style={{ color: '#1890ff' }} />,
      industry_news: <BookOutlined style={{ color: '#52c41a' }} />,
      policy_regulation: <BulbOutlined style={{ color: '#fa8c16' }} />,
      research_progress: <TrophyOutlined style={{ color: '#eb2f96' }} />,
      application_case: <HeartOutlined style={{ color: '#13c2c2' }} />,
      other: <EyeOutlined style={{ color: '#666' }} />
    };
    return icons[category] || icons.other;
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>正在生成智能推荐...</div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="暂无推荐内容" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <FireOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
          智能推荐
        </Title>
        <Text type="secondary">基于AI分析的个性化新闻推荐</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 重要性统计 */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <TrophyOutlined style={{ color: '#faad14' }} />
                重要性分析
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={8} sm={6} md={4}>
                <Statistic
                  title="高重要性"
                  value={recommendations.importance_stats.high || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                  prefix={<FireOutlined />}
                />
              </Col>
              <Col xs={8} sm={6} md={4}>
                <Statistic
                  title="中等重要性"
                  value={recommendations.importance_stats.medium || 0}
                  valueStyle={{ color: '#faad14' }}
                  prefix={<ThunderboltOutlined />}
                />
              </Col>
              <Col xs={8} sm={6} md={4}>
                <Statistic
                  title="低重要性"
                  value={recommendations.importance_stats.low || 0}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<EyeOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 热门新闻 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <FireOutlined style={{ color: '#ff4d4f' }} />
                热门推荐
              </Space>
            }
            extra={
              <Button type="link" onClick={loadRecommendations}>
                刷新推荐
              </Button>
            }
            style={{ borderRadius: '12px' }}
          >
            <List
              dataSource={recommendations.trending_news}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  <List.Item.Meta
                    title={
                      <div>
                        <Text strong style={{ fontSize: '14px', lineHeight: '1.4' }}>
                          {item.title}
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          <Space size="small">
                            <Tag 
                              color={getImportanceColor(item.importance)}
                              style={{ fontSize: '10px', padding: '0 4px' }}
                            >
                              {IMPORTANCE_LABELS[item.importance]}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {item.source}
                            </Text>
                          </Space>
                        </div>
                      </div>
                    }
                    description={
                      <Paragraph 
                        ellipsis={{ rows: 2 }}
                        style={{ margin: 0, fontSize: '12px', color: '#666' }}
                      >
                        {item.summary}
                      </Paragraph>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 分类推荐 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <BookOutlined style={{ color: '#1890ff' }} />
                分类推荐
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <Space wrap>
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <Button
                    key={key}
                    type={selectedCategory === key ? 'primary' : 'default'}
                    size="small"
                    icon={getCategoryIcon(key)}
                    onClick={() => setSelectedCategory(key)}
                    style={{ 
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    {label}
                  </Button>
                ))}
              </Space>
            </div>
            
            <List
              dataSource={recommendations.category_recommendations[selectedCategory] || []}
              renderItem={(item) => (
                <List.Item style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <List.Item.Meta
                    title={
                      <Tooltip title={item.title}>
                        <Text strong style={{ fontSize: '13px' }}>
                          {item.title.length > 40 ? `${item.title.substring(0, 40)}...` : item.title}
                        </Text>
                      </Tooltip>
                    }
                    description={
                      <Space size="small">
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {item.source}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {new Date(item.timestamp).toLocaleDateString()}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 今日亮点 */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <StarOutlined style={{ color: '#faad14' }} />
                今日亮点
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            {recommendations.recent_highlights.length > 0 ? (
              <Row gutter={[16, 16]}>
                {recommendations.recent_highlights.map((item, index) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                    <Card
                      size="small"
                      hoverable
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #f0f0f0',
                        transition: 'all 0.3s ease'
                      }}
                      styles={{ body: { padding: '12px' } }}
                    >
                      <div style={{ marginBottom: '8px' }}>
                        <Tag 
                          color={getImportanceColor(item.importance)}
                          style={{ fontSize: '10px', padding: '2px 6px' }}
                        >
                          {IMPORTANCE_LABELS[item.importance]}
                        </Tag>
                        {getCategoryIcon(item.category)}
                      </div>
                      
                      <Tooltip title={item.title}>
                        <Title 
                          level={5} 
                          style={{ 
                            margin: '0 0 8px', 
                            fontSize: '13px',
                            lineHeight: '1.3'
                          }}
                          ellipsis={{ rows: 2 }}
                        >
                          {item.title}
                        </Title>
                      </Tooltip>
                      
                      <Paragraph 
                        ellipsis={{ rows: 2 }}
                        style={{ 
                          margin: '0 0 8px', 
                          fontSize: '11px',
                          color: '#666',
                          lineHeight: '1.4'
                        }}
                      >
                        {item.summary}
                      </Paragraph>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {item.source}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="今日暂无亮点新闻" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default NewsRecommendations;
