import React, { useState, useEffect } from 'react';
import { 
  Card, 
  List, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  Row, 
  Col, 
  Typography,
  message,
  Modal,
  Pagination
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  LinkOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import { NewsItem, CATEGORY_LABELS, IMPORTANCE_LABELS } from '../types';
import { NewsService } from '../services/newsService';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const NewsList: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    importance: '',
    days: 7
  });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadNews = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: pageSize,
        ...filters
      };
      
      const response = await NewsService.getNews(params);
      setNews(response.results || []);
      setTotal(response.count || 0);
      setCurrentPage(page);
    } catch (error) {
      message.error('获取新闻列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews(1);
  }, [filters]);

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    loadNews(page);
  };

  const showNewsDetail = (item: NewsItem) => {
    setSelectedNews(item);
    setModalVisible(true);
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

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>AI新闻列表</Title>
        <Text type="secondary">浏览和搜索最新的AI资讯</Text>
      </div>

      {/* 搜索和筛选 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索新闻标题或内容"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('category', value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="重要程度"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('importance', value)}
            >
              {Object.entries(IMPORTANCE_LABELS).map(([key, label]) => (
                <Option key={key} value={key}>{label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="时间范围"
              defaultValue={7}
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('days', value)}
            >
              <Option value={1}>今天</Option>
              <Option value={3}>3天内</Option>
              <Option value={7}>7天内</Option>
              <Option value={30}>30天内</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button type="primary" onClick={() => loadNews(1)} loading={loading}>
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 新闻列表 */}
      <Card>
        <List
          loading={loading}
          dataSource={news}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => showNewsDetail(item)}
                >
                  查看详情
                </Button>,
                item.url && (
                  <Button 
                    type="link" 
                    icon={<LinkOutlined />}
                    href={item.url}
                    target="_blank"
                  >
                    原文链接
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong style={{ fontSize: '16px' }}>{item.title}</Text>
                    <Tag color={getImportanceColor(item.importance)}>
                      {IMPORTANCE_LABELS[item.importance]}
                    </Tag>
                    <Tag color={getCategoryColor(item.category)}>
                      {CATEGORY_LABELS[item.category]}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph 
                      ellipsis={{ rows: 2, expandable: false }}
                      style={{ marginBottom: '8px' }}
                    >
                      {item.summary}
                    </Paragraph>
                    <Space size="large">
                      <Text type="secondary">
                        <UserOutlined /> {item.source}
                      </Text>
                      <Text type="secondary">
                        <CalendarOutlined /> {new Date(item.timestamp).toLocaleString()}
                      </Text>
                    </Space>
                  </div>
                }
              />
            </List.Item>
          )}
        />
        
        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Pagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
            />
          </div>
        )}
      </Card>

      {/* 新闻详情模态框 */}
      <Modal
        title={selectedNews?.title}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>,
          selectedNews?.url && (
            <Button 
              key="link" 
              type="primary"
              icon={<LinkOutlined />}
              href={selectedNews.url}
              target="_blank"
            >
              查看原文
            </Button>
          )
        ].filter(Boolean)}
        width={800}
      >
        {selectedNews && (
          <div>
            <Space style={{ marginBottom: '16px' }}>
              <Tag color={getImportanceColor(selectedNews.importance)}>
                {IMPORTANCE_LABELS[selectedNews.importance]}
              </Tag>
              <Tag color={getCategoryColor(selectedNews.category)}>
                {CATEGORY_LABELS[selectedNews.category]}
              </Tag>
              <Text type="secondary">
                <UserOutlined /> {selectedNews.source}
              </Text>
              <Text type="secondary">
                <CalendarOutlined /> {new Date(selectedNews.timestamp).toLocaleString()}
              </Text>
            </Space>
            
            <div style={{ marginBottom: '16px' }}>
              <Title level={5}>摘要</Title>
              <Paragraph>{selectedNews.summary}</Paragraph>
            </div>

            {selectedNews.key_points && selectedNews.key_points.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={5}>关键点</Title>
                <ul>
                  {selectedNews.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <Title level={5}>详细内容</Title>
              <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selectedNews.content}
              </Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewsList;