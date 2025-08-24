import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Select,
  DatePicker,
  Space,
  Statistic,
  Progress,
  Tag,
  Empty,
  Spin,
  message,
  Button
} from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TagsOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { NewsService } from '../services/newsService';
import { CATEGORY_LABELS, IMPORTANCE_LABELS } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

interface AnalyticsData {
  total_news: number;
  daily_trend: Array<{ date: string; count: number }>;
  category_distribution: Record<string, number>;
  importance_distribution: Record<string, number>;
  source_distribution: Record<string, number>;
  growth_rate: number;
  peak_hours: Array<{ hour: number; count: number }>;
}

const NewsAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'days'),
    dayjs()
  ]);
  const [selectedMetric, setSelectedMetric] = useState<'category' | 'importance' | 'source'>('category');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // 模拟分析数据（在实际项目中这会是真实的API调用）
      const response = await NewsService.getNews({ 
        page_size: 100,
        days: dateRange[1].diff(dateRange[0], 'days') + 1
      });
      
      const news = response.results || [];
      
      // 生成分析数据
      const categoryDist: Record<string, number> = {};
      const importanceDist: Record<string, number> = {};
      const sourceDist: Record<string, number> = {};
      const dailyCount: Record<string, number> = {};
      const hourlyCount: Record<number, number> = {};
      
      news.forEach(item => {
        // 分类分布
        categoryDist[item.category] = (categoryDist[item.category] || 0) + 1;
        
        // 重要性分布
        importanceDist[item.importance] = (importanceDist[item.importance] || 0) + 1;
        
        // 来源分布
        sourceDist[item.source] = (sourceDist[item.source] || 0) + 1;
        
        // 日期分布
        const date = dayjs(item.timestamp).format('YYYY-MM-DD');
        dailyCount[date] = (dailyCount[date] || 0) + 1;
        
        // 小时分布
        const hour = dayjs(item.timestamp).hour();
        hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
      });
      
      // 生成日期趋势
      const dateRange_days = [];
      let current = dateRange[0].clone();
      while (current.isBefore(dateRange[1]) || current.isSame(dateRange[1])) {
        dateRange_days.push({
          date: current.format('YYYY-MM-DD'),
          count: dailyCount[current.format('YYYY-MM-DD')] || 0
        });
        current = current.add(1, 'day');
      }
      
      // 生成小时分布
      const peakHours = Object.entries(hourlyCount)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      
      // 计算增长率（简化计算）
      const recentCount = dateRange_days.slice(-3).reduce((sum, day) => sum + day.count, 0);
      const previousCount = dateRange_days.slice(-6, -3).reduce((sum, day) => sum + day.count, 0);
      const growthRate = previousCount > 0 ? ((recentCount - previousCount) / previousCount) * 100 : 0;
      
      setAnalytics({
        total_news: news.length,
        daily_trend: dateRange_days,
        category_distribution: categoryDist,
        importance_distribution: importanceDist,
        source_distribution: sourceDist,
        growth_rate: growthRate,
        peak_hours: peakHours
      });
      
    } catch (error) {
      console.error('加载分析数据失败:', error);
      message.error('加载分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const renderDistributionChart = () => {
    if (!analytics) return null;
    
    let data: Record<string, number> = {};
    let labels: Record<string, string> = {};
    
    switch (selectedMetric) {
      case 'category':
        data = analytics.category_distribution;
        labels = CATEGORY_LABELS;
        break;
      case 'importance':
        data = analytics.importance_distribution;
        labels = IMPORTANCE_LABELS;
        break;
      case 'source':
        data = analytics.source_distribution;
        labels = Object.keys(analytics.source_distribution).reduce((acc, key) => {
          acc[key] = key;
          return acc;
        }, {} as Record<string, string>);
        break;
    }
    
    const total = Object.values(data).reduce((sum, count) => sum + count, 0);
    const sortedData = Object.entries(data)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10); // 只显示前10个
    
    return (
      <div>
        {sortedData.map(([key, count], index) => {
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#a0d911', '#2f54eb'];
          
          return (
            <div key={key} style={{ marginBottom: '12px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '4px'
              }}>
                <Text strong style={{ fontSize: '14px' }}>
                  {labels[key] || key}
                </Text>
                <Space>
                  <Text style={{ fontSize: '13px' }}>{count}篇</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {percentage.toFixed(1)}%
                  </Text>
                </Space>
              </div>
              <Progress 
                percent={percentage} 
                strokeColor={colors[index % colors.length]}
                showInfo={false}
                size={{ height: 8 }}
                style={{ marginBottom: '4px' }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderTrendIndicator = () => {
    if (!analytics) return null;
    
    const { growth_rate } = analytics;
    let icon, color, text;
    
    if (growth_rate > 5) {
      icon = <RiseOutlined />;
      color = '#52c41a';
      text = '上升趋势';
    } else if (growth_rate < -5) {
      icon = <FallOutlined />;
      color = '#f5222d';
      text = '下降趋势';
    } else {
      icon = <MinusOutlined />;
      color = '#faad14';
      text = '趋势平稳';
    }
    
    return (
      <Space>
        <span style={{ color }}>{icon}</span>
        <Text style={{ color, fontWeight: 'bold' }}>
          {text} ({growth_rate > 0 ? '+' : ''}{growth_rate.toFixed(1)}%)
        </Text>
      </Space>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>正在分析数据...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ padding: '24px' }}>
        <Empty description="暂无分析数据" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <BarChartOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
          数据分析
        </Title>
        <Text type="secondary">AI新闻数据深度分析与洞察</Text>
      </div>

      {/* 控制面板 */}
      <Card style={{ marginBottom: '24px', borderRadius: '12px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <CalendarOutlined />
              <Text strong>时间范围:</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <PieChartOutlined />
              <Text strong>分析维度:</Text>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={{ width: 120 }}
              >
                <Option value="category">分类</Option>
                <Option value="importance">重要性</Option>
                <Option value="source">来源</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button type="primary" onClick={loadAnalytics} loading={loading}>
              刷新数据
            </Button>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 关键指标 */}
        <Col span={24}>
          <Card title="关键指标" style={{ borderRadius: '12px' }}>
            <Row gutter={[24, 24]}>
              <Col xs={12} sm={6}>
                <Statistic
                  title="总新闻数"
                  value={analytics.total_news}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="日均新闻"
                  value={(analytics.total_news / Math.max(dateRange[1].diff(dateRange[0], 'days') + 1, 1)).toFixed(1)}
                  prefix={<LineChartOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <Statistic
                  title="活跃分类"
                  value={Object.keys(analytics.category_distribution).length}
                  prefix={<TagsOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col xs={12} sm={6}>
                <div>
                  <div style={{ color: '#8c8c8c', fontSize: '14px', marginBottom: '4px' }}>
                    趋势分析
                  </div>
                  <div style={{ color: '#722ed1' }}>
                    {renderTrendIndicator()}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 分布分析 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <PieChartOutlined />
                {selectedMetric === 'category' ? '分类' : selectedMetric === 'importance' ? '重要性' : '来源'}分布
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            {renderDistributionChart()}
          </Card>
        </Col>

        {/* 时间趋势 */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <LineChartOutlined />
                时间趋势
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <div style={{ height: '300px', overflowY: 'auto' }}>
              {analytics.daily_trend.map((day, index) => {
                const maxCount = Math.max(...analytics.daily_trend.map(d => d.count));
                const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                
                return (
                  <div key={day.date} style={{ marginBottom: '8px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '2px'
                    }}>
                      <Text style={{ fontSize: '12px' }}>
                        {dayjs(day.date).format('MM-DD')}
                      </Text>
                      <Text strong style={{ fontSize: '12px' }}>
                        {day.count}篇
                      </Text>
                    </div>
                    <Progress 
                      percent={percentage} 
                      strokeColor="#1890ff"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* 活跃时段 */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                活跃时段分析
              </Space>
            }
            style={{ borderRadius: '12px' }}
          >
            <Row gutter={[16, 16]}>
              {analytics.peak_hours.map((hour, index) => (
                <Col xs={12} sm={8} md={6} lg={4} key={hour.hour}>
                  <Card 
                    size="small" 
                    style={{ 
                      textAlign: 'center',
                      background: index < 3 ? '#f6ffed' : '#fafafa',
                      border: index < 3 ? '1px solid #b7eb8f' : '1px solid #d9d9d9'
                    }}
                  >
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '16px', color: index < 3 ? '#52c41a' : '#666' }}>
                        {hour.hour}:00
                      </Text>
                      {index < 3 && (
                        <Tag 
                          color="green" 
                          style={{ marginLeft: '4px', fontSize: '10px', padding: '0 4px' }}
                        >
                          高峰
                        </Tag>
                      )}
                    </div>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      {hour.count} 篇新闻
                    </Text>
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

export default NewsAnalytics;
