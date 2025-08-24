import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Space, 
  Button, 
  DatePicker, 
  Typography,
  message,
  Tooltip,
  Modal,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  ReloadOutlined, 
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { FetchHistory as FetchHistoryType } from '../types';
import { NewsService } from '../services/newsService';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const FetchHistory: React.FC = () => {
  const [history, setHistory] = useState<FetchHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedRecord, setSelectedRecord] = useState<FetchHistoryType | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    failed: 0,
    partial: 0
  });

  const loadHistory = async (page = 1) => {
    try {
      setLoading(true);
      const params: any = {
        page,
        page_size: pageSize
      };

      if (dateRange) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await NewsService.getFetchHistory(params);
      setHistory(response.results || []);
      setTotal(response.count || 0);
      setCurrentPage(page);

      // 计算统计信息
      const results = response.results || [];
      const statsData = {
        total: results.length,
        success: results.filter(item => item.status === 'success').length,
        failed: results.filter(item => item.status === 'failed').length,
        partial: results.filter(item => item.status === 'partial').length
      };
      setStats(statsData);
    } catch (error) {
      message.error('获取历史记录失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, [dateRange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'partial':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success';
      case 'failed': return 'error';
      case 'partial': return 'warning';
      default: return 'default';
    }
  };

  const showDetail = (record: FetchHistoryType) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const columns: ColumnsType<FetchHistoryType> = [
    {
      title: '获取日期',
      dataIndex: 'fetch_date',
      key: 'fetch_date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('YYYY-MM-DD')}
        </Space>
      ),
      sorter: true,
      width: 150
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: FetchHistoryType) => (
        <Space>
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>
            {record.status_display}
          </Tag>
        </Space>
      ),
      width: 120,
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' },
        { text: '部分成功', value: 'partial' }
      ]
    },
    {
      title: '新闻数量',
      dataIndex: 'news_count',
      key: 'news_count',
      render: (count: number) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{count}</Text>
        </Space>
      ),
      sorter: true,
      width: 120
    },
    {
      title: '日志信息',
      dataIndex: 'log_message',
      key: 'log_message',
      render: (message: string) => (
        <Tooltip title={message}>
          <Text ellipsis style={{ maxWidth: 300 }}>
            {message}
          </Text>
        </Tooltip>
      ),
      ellipsis: true
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
      width: 180
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: FetchHistoryType) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          查看详情
        </Button>
      ),
      width: 100
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>获取历史</Title>
        <Text type="secondary">查看AI新闻获取的历史记录和统计信息</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总记录数"
              value={total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="成功次数"
              value={stats.success}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="失败次数"
              value={stats.failed}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="部分成功"
              value={stats.partial}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和操作 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text>日期范围:</Text>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => loadHistory(1)}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 历史记录表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={history}
          rowKey="id"
          loading={loading}
          pagination={{
            current: currentPage,
            total: total,
            pageSize: pageSize,
            onChange: loadHistory,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* 详情模态框 */}
      <Modal
        title="获取历史详情"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedRecord && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text strong>获取日期: </Text>
                <Text>{dayjs(selectedRecord.fetch_date).format('YYYY-MM-DD')}</Text>
              </Col>
              <Col span={12}>
                <Text strong>状态: </Text>
                <Space>
                  {getStatusIcon(selectedRecord.status)}
                  <Tag color={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status_display}
                  </Tag>
                </Space>
              </Col>
            </Row>
            
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Text strong>新闻数量: </Text>
                <Text>{selectedRecord.news_count}</Text>
              </Col>
              <Col span={12}>
                <Text strong>创建时间: </Text>
                <Text>{dayjs(selectedRecord.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
              </Col>
            </Row>

            <div style={{ marginTop: '16px' }}>
              <Text strong>日志信息:</Text>
              <Paragraph
                style={{ 
                  marginTop: '8px',
                  padding: '12px',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedRecord.log_message}
              </Paragraph>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FetchHistory;