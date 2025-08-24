import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Tag, 
  Space, 
  Button, 
  Typography,
  message,
  Spin,
  Empty,
  Row,
  Col,
  Statistic,
  Select,
  Progress
} from 'antd';
import { 
  FireOutlined,
  TrophyOutlined,
  TagsOutlined,
  LinkOutlined,
  CalendarOutlined,
  UserOutlined,
  RocketOutlined,
  BulbOutlined
} from '@ant-design/icons';
import { NewsItem, NewsStats, CATEGORY_LABELS, IMPORTANCE_LABELS } from '../types';
import { NewsService } from '../services/newsService';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface RecommendationItem extends NewsItem {
  score: number;
  reasons: string[];
}

interface StatsData {
  importance_stats: Record<string, number>;
  category_stats: Record<string, number>;
  source_stats: Record<string, number>;
  total_count: number;
  today_count: number;
  week_count: number;
}

const NewsRecommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImportance, setSelectedImportance] = useState<string>('all');

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据和新闻列表
      const [statsResponse, newsResponse] = await Promise.all([
        NewsService.getStats(),
        NewsService.getNews({ page_size: 20, days: 7 })
      ]);

      // 处理统计数据
      const stats: StatsData = {
        importance_stats: statsResponse.importance_stats ? 
          statsResponse.importance_stats.reduce((acc, item) => {
            acc[item.importance] = item.count;
            return acc;
          }, {} as Record<string, number>) : {},
        category_stats: statsResponse.category_stats ? 
          statsResponse.category_stats.reduce((acc, item) => {
            acc[item.category] = item.count;
            return acc;
          }, {} as Record<string, number>) : {},
        source_stats: statsResponse.source_stats ? 
          statsResponse.source_stats.reduce((acc, item) => {
            acc[item.source] = item.count;
            return acc;
          }, {} as Record<string, number>) : {},
        total_count: statsResponse.total_count || 0,
        today_count: statsResponse.today_count || 0,
        week_count: statsResponse.week_count || 0
      };

      setStatsData(stats);

      // 计算推荐分数
      const newsItems = newsResponse.results || [];
      const recommendedNews = calculateRecommendations(newsItems, stats);
      
      setRecommendations(recommendedNews);
    } catch (error) {
      console.error('获取推荐新闻失败:', error);
      message.error('获取推荐新闻失败');
    } finally {
      setLoading(false);
    }
  };

  const calculateRecommendations = (newsItems: NewsItem[], stats: StatsData): RecommendationItem[] => {
    return newsItems.map(item => {
      let score = 0;
      const reasons: string[] = [];

      // 重要性权重
      const importanceWeights = { high: 3, medium: 2, low: 1 };
      const importanceScore = importanceWeights[item.importance] || 1;
      score += importanceScore * 20;
      
      if (item.importance === 'high') {
        reasons.push('高重要性');
      }

      // 类别热度权重
      const categoryCount = stats.category_stats[item.category] || 1;
      const maxCategoryCount = Math.max(...Object.values(stats.category_stats));
      const categoryScore = (categoryCount / maxCategoryCount) * 15;
      score += categoryScore;
      
      if (categoryCount > maxCategoryCount * 0.7) {
        reasons.push('热门分类');
      }

      // 时间新鲜度
      const now = new Date();
      const newsDate = new Date(item.timestamp);
      const hoursDiff = (now.getTime() - newsDate.getTime()) / (1000 * 60 * 60);
      const freshnessScore = Math.max(0, 20 - hoursDiff / 2);
      score += freshnessScore;
      
      if (hoursDiff < 6) {
        reasons.push('最新发布');
      }

      // 内容丰富度
      const contentLength = item.content?.length || 0;
      const keyPointsLength = item.key_points?.length || 0;
      const tagsLength = item.tags?.length || 0;
      
      const richnesScore = Math.min(15, (contentLength / 1000) * 5 + keyPointsLength * 2 + tagsLength);
      score += richnesScore;
      
      if (keyPointsLength >= 3) {
        reasons.push('内容详细');
      }

      // 技术突破加权
      if (item.category === 'tech_breakthrough') {
        score += 10;
        reasons.push('技术突破');
      }

      // 有链接的新闻加权
      if (item.url) {
        score += 5;
        reasons.push('可查看原文');
      }

      return {
        ...item,
        score: Math.round(score),
        reasons
      };
    }).sort((a, b) => b.score - a.score);
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (selectedImportance !== 'all') {
      filtered = filtered.filter(item => item.importance === selectedImportance);
    }
    
    return filtered;
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      tech_breakthrough: 'purple',
      product_release: 'blue',
      industry_news: 'cyan',
      policy_regulation: 'orange',
      research_progress: 'green',
      application_case: 'magenta',
      other: 'default'
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#f5222d';
    if (score >= 60) return '#fa8c16';
    if (score >= 40) return '#fadb14';
    return '#52c41a';
  };

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <RocketOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          智能推荐
        </Title>
        <Text type="secondary">基于内容质量、时效性和相关性的个性化新闻推荐</Text>
      </div>

      {/* 统计概览 */}
      {statsData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <Statistic
                title="总新闻数"
                value={statsData.total_count}
                prefix={<FireOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={statsData.today_count}
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <Statistic
                title="本周新增"
                value={statsData.week_count}
                prefix={<BulbOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Card>
              <Statistic
                title="推荐新闻"
                value={filteredRecommendations.length}
                prefix={<TagsOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 筛选器 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>筛选分类</Text>
            </div>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              placeholder="选择分类"
            >
              <Option value="all">全部分类</Option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>筛选重要性</Text>
            </div>
            <Select
              value={selectedImportance}
              onChange={setSelectedImportance}
              style={{ width: '100%' }}
              placeholder="选择重要性"
            >
              <Option value="all">全部重要性</Option>
              {Object.entries(IMPORTANCE_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>操作</Text>
            </div>
            <Button type="primary" onClick={loadRecommendations} loading={loading}>
              刷新推荐
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 推荐列表 */}
      <Card>
        <Spin spinning={loading}>
          {filteredRecommendations.length === 0 ? (
            <Empty 
              description="暂无推荐新闻"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <List
              dataSource={filteredRecommendations}
              renderItem={(item, index) => (
                <List.Item
                  style={{
                    padding: '20px 24px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    background: index < 3 ? '#f6ffed' : '#fff',
                    border: `1px solid ${index < 3 ? '#b7eb8f' : '#f0f0f0'}`,
                    position: 'relative'
                  }}
                >
                  {/* 排名徽章 */}
                  {index < 3 && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: index === 0 ? '#faad14' : index === 1 ? '#8c8c8c' : '#d48806',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>
                      {index + 1}
                    </div>
                  )}

                  <List.Item.Meta
                    title={
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div style={{ flex: 1, marginRight: '12px' }}>
                            <Text strong style={{ fontSize: '16px', color: '#262626' }}>
                              {item.title}
                            </Text>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ marginBottom: '4px' }}>
                              <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>推荐分数</Text>
                            </div>
                            <Progress
                              type="circle"
                              size={40}
                              percent={Math.min(100, item.score)}
                              format={() => item.score}
                              strokeColor={getScoreColor(item.score)}
                            />
                          </div>
                        </div>
                        
                        <Space size="small" wrap style={{ marginBottom: '8px' }}>
                          <Tag 
                            color={getImportanceColor(item.importance)}
                            style={{ fontWeight: 'bold' }}
                          >
                            {IMPORTANCE_LABELS[item.importance]}
                          </Tag>
                          <Tag color={getCategoryColor(item.category)}>
                            {CATEGORY_LABELS[item.category]}
                          </Tag>
                          <Tag icon={<UserOutlined />} color="blue">
                            {item.source}
                          </Tag>
                          {item.reasons.map((reason, idx) => (
                            <Tag key={idx} color="green" style={{ fontSize: '11px' }}>
                              {reason}
                            </Tag>
                          ))}
                        </Space>
                      </div>
                    }
                    description={
                      <div>
                        <Paragraph 
                          ellipsis={{ rows: 2, expandable: false }}
                          style={{ marginBottom: '12px', color: '#595959' }}
                        >
                          {item.summary}
                        </Paragraph>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          paddingTop: '8px',
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          <Space>
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                              <CalendarOutlined style={{ marginRight: '4px' }} />
                              {new Date(item.timestamp).toLocaleString()}
                            </Text>
                            {item.url && (
                              <Button 
                                type="link" 
                                size="small"
                                icon={<LinkOutlined />}
                                href={item.url}
                                target="_blank"
                              >
                                查看原文
                              </Button>
                            )}
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default NewsRecommendations;