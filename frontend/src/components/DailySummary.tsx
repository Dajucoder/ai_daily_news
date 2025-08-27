import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  List, 
  Tag, 
  Space, 
  Button, 
  DatePicker, 
  Row, 
  Col, 
  Spin,
  Divider,
  Empty,
  Modal,
  message
} from 'antd';
import { 
  CalendarOutlined, 
  FileTextOutlined, 
  LinkOutlined,
  ReloadOutlined,
  TrophyOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { NewsService } from '../services/newsService';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface DailyReport {
  collection_date: string;
  summary: string;
  total_count: number;
  top_stories: Array<{
    title: string;
    source: string;
    summary: string;
    original_link: string;
    category: string;
    importance: string;
  }>;
  category_stats: Record<string, number>;
  importance_stats: Record<string, number>;
  generated_time: string;
}

const DailySummary: React.FC = () => {
  const [currentReport, setCurrentReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const loadLatestReport = async () => {
    try {
      setLoading(true);
      const report = await NewsService.getLatestDailyReport();
      if (report && !report.error) {
        setCurrentReport(report);
      } else {
        setCurrentReport(null);
      }
    } catch (error) {
      console.error('获取最新每日总结失败:', error);
      setCurrentReport(null);
    } finally {
      setLoading(false);
    }
  };

  const loadReportByDate = async (date: string) => {
    try {
      setLoading(true);
      const report = await NewsService.getDailyReportByDate(date);
      if (report && !report.error) {
        setCurrentReport(report);
      } else {
        setCurrentReport(null);
      }
    } catch (error) {
      console.error('获取指定日期每日总结失败:', error);
      setCurrentReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLatestReport();
  }, []);

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = date.format('YYYY-MM-DD');
      loadReportByDate(dateStr);
    }
  };

  const handleDeleteReport = (date: string) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除 ${dayjs(date).format('YYYY年MM月DD日')} 的每日总结吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const result = await NewsService.deleteDailyReport(date);
          message.success(result.message || '每日总结删除成功');
          setCurrentReport(null);
        } catch (error) {
          message.error('删除每日总结失败');
        }
      },
    });
  };

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

  const getCategoryLabel = (category: string) => {
    const labels = {
      tech_breakthrough: '技术突破',
      product_release: '产品发布',
      industry_news: '行业动态',
      policy_regulation: '政策法规',
      research_progress: '研究进展',
      application_case: '应用案例',
      other: '其他'
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getImportanceLabel = (importance: string) => {
    const labels = {
      high: '高',
      medium: '中',
      low: '低'
    };
    return labels[importance as keyof typeof labels] || importance;
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>AI新闻每日总结</Title>
        <Text type="secondary">查看AI生成的每日新闻总结和重点资讯</Text>
      </div>

      {/* 日期选择和刷新 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Space>
              <CalendarOutlined />
              <Text strong>选择日期:</Text>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                placeholder="选择日期"
              />
            </Space>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={loadLatestReport}
              loading={loading}
            >
              刷新最新
            </Button>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text>正在加载每日总结...</Text>
            </div>
          </div>
        </Card>
      ) : currentReport ? (
        <div>
          {/* 总结概览 */}
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space>
                  <FileTextOutlined />
                  <span>{dayjs(currentReport.collection_date).format('YYYY年MM月DD日')} AI新闻总结</span>
                </Space>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteReport(currentReport.collection_date)}
                  title="删除此总结"
                >
                  删除
                </Button>
              </div>
            }
            style={{ marginBottom: '24px' }}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={16}>
                <div style={{ marginBottom: '16px' }}>
                  <Title level={4}>今日概况</Title>
                  <Paragraph style={{ fontSize: '16px', lineHeight: '1.6' }}>
                    {currentReport.summary}
                  </Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small" style={{ background: '#f8f9fa' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                      {currentReport.total_count}
                    </div>
                    <div style={{ color: '#666', marginTop: '4px' }}>
                      篇新闻
                    </div>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* 统计信息 */}
            {(currentReport.category_stats || currentReport.importance_stats) && (
              <div style={{ marginTop: '24px' }}>
                <Divider />
                <Row gutter={[24, 16]}>
                  {currentReport.category_stats && Object.keys(currentReport.category_stats).length > 0 && (
                    <Col xs={24} md={12}>
                      <Title level={5}>分类统计</Title>
                      <Space wrap>
                        {Object.entries(currentReport.category_stats).map(([category, count]) => (
                          <Tag key={category} color={getCategoryColor(category)}>
                            {getCategoryLabel(category)}: {count}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                  )}
                  {currentReport.importance_stats && Object.keys(currentReport.importance_stats).length > 0 && (
                    <Col xs={24} md={12}>
                      <Title level={5}>重要程度统计</Title>
                      <Space wrap>
                        {Object.entries(currentReport.importance_stats).map(([importance, count]) => (
                          <Tag key={importance} color={getImportanceColor(importance)}>
                            {getImportanceLabel(importance)}: {count}
                          </Tag>
                        ))}
                      </Space>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </Card>

          {/* 重点新闻 */}
          {currentReport.top_stories && currentReport.top_stories.length > 0 && (
            <Card 
              title={
                <Space>
                  <TrophyOutlined />
                  <span>今日重点新闻</span>
                </Space>
              }
            >
              <List
                dataSource={currentReport.top_stories}
                renderItem={(story, index) => (
                  <List.Item
                    actions={[
                      story.original_link && (
                        <Button 
                          type="link" 
                          icon={<LinkOutlined />}
                          href={story.original_link}
                          target="_blank"
                        >
                          查看原文
                        </Button>
                      )
                    ].filter(Boolean)}
                    style={{
                      padding: '20px',
                      marginBottom: '12px',
                      background: '#fff',
                      border: '1px solid #f0f0f0',
                      borderRadius: '8px'
                    }}
                  >
                    <List.Item.Meta
                      title={
                        <div>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '16px' }}>
                              {index + 1}. {story.title}
                            </Text>
                          </div>
                          <Space size="small">
                            <Tag color={getImportanceColor(story.importance)}>
                              {getImportanceLabel(story.importance)}
                            </Tag>
                            <Tag color={getCategoryColor(story.category)}>
                              {getCategoryLabel(story.category)}
                            </Tag>
                            <Tag color="blue">
                              {story.source}
                            </Tag>
                          </Space>
                        </div>
                      }
                      description={
                        <Paragraph 
                          style={{ 
                            marginTop: '12px',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#595959'
                          }}
                        >
                          {story.summary}
                        </Paragraph>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}

          {/* 生成时间 */}
          {currentReport.generated_time && (
            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Text type="secondary">
                生成时间: {dayjs(currentReport.generated_time).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <Empty
            description="暂无每日总结数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={loadLatestReport}>
              重新加载
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  );
};

export default DailySummary;