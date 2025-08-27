import React, { useState, useEffect, useCallback } from 'react';
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
  Pagination,
  Checkbox
} from 'antd';
import { 
  SearchOutlined, 
  EyeOutlined, 
  LinkOutlined,
  CalendarOutlined,
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ClearOutlined
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
  const [pageSize] = useState(5);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    importance: '',
    source: '',
    days: 7
  });
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [availableSources, setAvailableSources] = useState<string[]>([]);
  const [selectedNewsIds, setSelectedNewsIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const loadNews = useCallback(async (page = 1) => {
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
    } catch (error: any) {
      console.error('获取新闻列表失败:', error);
      
      // 如果是分页错误，重置到第1页
      if (error.response?.status === 404 && page > 1) {
        message.warning('该页面不存在，已跳转到第一页');
        loadNews(1);
        return;
      }
      
      // 其他错误
      const errorMessage = error.response?.data?.detail || error.message || '获取新闻列表失败';
      message.error(errorMessage);
      
      // 如果当前页大于1且出错，尝试回到第1页
      if (page > 1) {
        setCurrentPage(1);
      }
    } finally {
      setLoading(false);
    }
  }, [pageSize, filters]);

  const loadAvailableSources = async () => {
    try {
      const response = await NewsService.getStats();
      const sourceStats = response.source_stats || [];
      const sources = sourceStats.map((stat: any) => stat.source);
      setAvailableSources(sources);
    } catch (error) {
      console.error('获取RSS源列表失败:', error);
      // 如果获取失败，使用默认的RSS源列表
      setAvailableSources([
        'Hugging Face博客',
        'Reddit机器学习',
        'MIT Tech Review',
        'OpenAI博客',
        'DeepMind博客'
      ]);
    }
  };

  useEffect(() => {
    loadNews(1);
  }, [filters, loadNews]);

  useEffect(() => {
    loadAvailableSources();
  }, []);

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

  const handleDeleteNews = (newsId: number) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这条新闻吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await NewsService.deleteNews(newsId);
          message.success('新闻删除成功');
          // 从选中列表中移除
          setSelectedNewsIds(prev => prev.filter(id => id !== newsId));
          loadNews(currentPage); // 重新加载当前页
        } catch (error) {
          message.error('删除新闻失败');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedNewsIds.length === 0) {
      message.warning('请先选择要删除的新闻');
      return;
    }

    Modal.confirm({
      title: '确认批量删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedNewsIds.length} 条新闻吗？此操作不可恢复。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const result = await NewsService.batchDeleteNews(selectedNewsIds);
          message.success(result.message);
          setSelectedNewsIds([]);
          setSelectAll(false);
          loadNews(currentPage); // 重新加载当前页
        } catch (error) {
          message.error('批量删除失败');
        }
      },
    });
  };

  const handleDeleteAll = () => {
    Modal.confirm({
      title: '确认删除所有新闻',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除所有新闻吗？此操作不可恢复，将清空所有新闻数据。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          const result = await NewsService.deleteAllNews();
          message.success(result.message);
          setSelectedNewsIds([]);
          setSelectAll(false);
          loadNews(1); // 重新加载第一页
        } catch (error) {
          message.error('删除所有新闻失败');
        }
      },
    });
  };

  const handleSelectNews = (newsId: number, checked: boolean) => {
    if (checked) {
      setSelectedNewsIds(prev => [...prev, newsId]);
    } else {
      setSelectedNewsIds(prev => prev.filter(id => id !== newsId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedNewsIds(news.map(item => item.id));
    } else {
      setSelectedNewsIds([]);
    }
  };

  // 当新闻列表变化时，更新全选状态
  useEffect(() => {
    if (news.length > 0) {
      const allSelected = news.every(item => selectedNewsIds.includes(item.id));
      setSelectAll(allSelected);
    }
  }, [news, selectedNewsIds]);

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
          <Col xs={24} sm={12} md={6}>
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
          <Col xs={24} sm={12} md={3}>
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
              placeholder="选择RSS源"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('source', value)}
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {availableSources.map((source) => (
                <Option key={source} value={source}>
                  {source}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={3}>
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
        
        {/* 批量操作按钮 */}
        <Row style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Space>
              <Checkbox
                checked={selectAll}
                indeterminate={selectedNewsIds.length > 0 && selectedNewsIds.length < news.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选
              </Checkbox>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                onClick={handleBatchDelete}
                disabled={selectedNewsIds.length === 0}
              >
                批量删除 ({selectedNewsIds.length})
              </Button>
              <Button
                type="primary"
                danger
                icon={<ClearOutlined />}
                onClick={handleDeleteAll}
              >
                一键删除所有
              </Button>
            </Space>
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
                ),
                <Button 
                  type="link" 
                  icon={<DeleteOutlined />}
                  danger
                  onClick={() => handleDeleteNews(item.id)}
                >
                  删除
                </Button>
              ].filter(Boolean)}
              style={{
                padding: '20px 24px',
                borderRadius: '8px',
                marginBottom: '8px',
                background: '#fff',
                border: '1px solid #f0f0f0',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.currentTarget.style.borderColor = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#f0f0f0';
              }}
            >
              <List.Item.Meta
                avatar={
                  <Checkbox
                    checked={selectedNewsIds.includes(item.id)}
                    onChange={(e) => handleSelectNews(item.id, e.target.checked)}
                  />
                }
                title={
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <Text strong style={{ fontSize: '18px', color: '#262626' }}>{item.title}</Text>
                    </div>
                    <Space size="small" wrap>
                      <Tag 
                        color={getImportanceColor(item.importance)}
                        style={{ fontWeight: 'bold', fontSize: '12px' }}
                      >
                        {IMPORTANCE_LABELS[item.importance]}
                      </Tag>
                      <Tag 
                        color={getCategoryColor(item.category)}
                        style={{ fontSize: '12px' }}
                      >
                        {CATEGORY_LABELS[item.category]}
                      </Tag>
                      <Tag 
                        icon={<UserOutlined />}
                        color="blue"
                        style={{ 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #1890ff, #40a9ff)',
                          border: 'none',
                          color: 'white'
                        }}
                        title={item.source_description}
                      >
                        {item.source}
                      </Tag>
                      {item.tags && item.tags.length > 0 && item.tags.slice(0, 2).map((tag, index) => (
                        <Tag key={index} color="geekblue" style={{ fontSize: '11px' }}>
                          {tag}
                        </Tag>
                      ))}
                      {item.tags && item.tags.length > 2 && (
                        <Tag color="default" style={{ fontSize: '11px' }}>
                          +{item.tags.length - 2}
                        </Tag>
                      )}
                    </Space>
                  </div>
                }
                description={
                  <div>
                    <Paragraph 
                      ellipsis={{ rows: 2, expandable: false }}
                      style={{ 
                        marginBottom: '12px',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        color: '#595959'
                      }}
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
                      <Space size="large">
                        <Text type="secondary" style={{ fontSize: '13px' }}>
                          <CalendarOutlined style={{ marginRight: '4px' }} />
                          {new Date(item.timestamp).toLocaleString()}
                        </Text>
                        {item.url && (
                          <Text type="secondary" style={{ fontSize: '13px' }}>
                            <LinkOutlined style={{ marginRight: '4px' }} />
                            来源链接可用
                          </Text>
                        )}
                      </Space>
                    </div>
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
              {selectedNews.url ? (
                <a 
                  href={selectedNews.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: '#1890ff', textDecoration: 'none' }}
                  title={selectedNews.source_description}
                >
                  <UserOutlined /> {selectedNews.source}
                </a>
              ) : (
                <Text type="secondary" title={selectedNews.source_description}>
                  <UserOutlined /> {selectedNews.source}
                </Text>
              )}
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

            {selectedNews.tags && selectedNews.tags.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={5}>标签</Title>
                <Space wrap>
                  {selectedNews.tags.map((tag, index) => (
                    <Tag key={index} color="geekblue">
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}

            {selectedNews.source_description && (
              <div style={{ marginBottom: '16px' }}>
                <Title level={5}>来源信息</Title>
                <Paragraph type="secondary">
                  {selectedNews.source_description}
                </Paragraph>
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