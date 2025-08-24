import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Button, 
  Space, 
  Typography,
  message,
  Divider,
  Row,
  Col,
  Select,
  Alert,
  Tooltip
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined,
  SettingOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  config_type: 'string' | 'number' | 'boolean' | 'json';
}

const SystemSettings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);

  // 默认配置项
  const defaultConfigs: SystemConfig[] = [
    {
      key: 'max_news_per_fetch',
      value: '10',
      description: '每次获取新闻的最大数量',
      config_type: 'number'
    },
    {
      key: 'fetch_interval_hours',
      value: '24',
      description: '自动获取新闻的间隔时间（小时）',
      config_type: 'number'
    },
    {
      key: 'enable_auto_fetch',
      value: 'true',
      description: '是否启用自动获取新闻',
      config_type: 'boolean'
    },
    {
      key: 'news_sources',
      value: 'techcrunch,venturebeat,wired',
      description: '新闻源列表（逗号分隔）',
      config_type: 'string'
    },
    {
      key: 'ai_keywords',
      value: 'artificial intelligence,machine learning,deep learning,AI,ML,neural network',
      description: 'AI相关关键词（逗号分隔）',
      config_type: 'string'
    },
    {
      key: 'content_min_length',
      value: '100',
      description: '新闻内容最小长度',
      config_type: 'number'
    },
    {
      key: 'enable_duplicate_check',
      value: 'true',
      description: '是否启用重复内容检查',
      config_type: 'boolean'
    },
    {
      key: 'log_level',
      value: 'INFO',
      description: '日志级别',
      config_type: 'string'
    }
  ];

  const loadConfigs = async () => {
    try {
      setLoading(true);
      // 这里应该调用API获取配置，暂时使用默认配置
      setConfigs(defaultConfigs);
      
      // 设置表单初始值
      const initialValues: any = {};
      defaultConfigs.forEach(config => {
        if (config.config_type === 'boolean') {
          initialValues[config.key] = config.value === 'true';
        } else if (config.config_type === 'number') {
          initialValues[config.key] = parseInt(config.value);
        } else {
          initialValues[config.key] = config.value;
        }
      });
      form.setFieldsValue(initialValues);
    } catch (error) {
      message.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const saveConfigs = async (values: any) => {
    try {
      setSaveLoading(true);
      
      // 这里应该调用API保存配置
      console.log('保存配置:', values);
      
      message.success('配置保存成功');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setSaveLoading(false);
    }
  };

  const resetToDefault = () => {
    const initialValues: any = {};
    defaultConfigs.forEach(config => {
      if (config.config_type === 'boolean') {
        initialValues[config.key] = config.value === 'true';
      } else if (config.config_type === 'number') {
        initialValues[config.key] = parseInt(config.value);
      } else {
        initialValues[config.key] = config.value;
      }
    });
    form.setFieldsValue(initialValues);
    message.info('已重置为默认配置');
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const renderFormItem = (config: SystemConfig) => {
    const { key, description, config_type } = config;

    switch (config_type) {
      case 'boolean':
        return (
          <Form.Item
            key={key}
            name={key}
            label={
              <Space>
                <Text>{description}</Text>
                <Tooltip title={`配置项: ${key}`}>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        );

      case 'number':
        return (
          <Form.Item
            key={key}
            name={key}
            label={
              <Space>
                <Text>{description}</Text>
                <Tooltip title={`配置项: ${key}`}>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            }
            rules={[
              { required: true, message: '请输入数值' },
              { type: 'number', min: 1, message: '数值必须大于0' }
            ]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
        );

      case 'string':
        if (key === 'log_level') {
          return (
            <Form.Item
              key={key}
              name={key}
              label={
                <Space>
                  <Text>{description}</Text>
                  <Tooltip title={`配置项: ${key}`}>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: '请选择日志级别' }]}
            >
              <Select>
                <Option value="DEBUG">DEBUG</Option>
                <Option value="INFO">INFO</Option>
                <Option value="WARNING">WARNING</Option>
                <Option value="ERROR">ERROR</Option>
              </Select>
            </Form.Item>
          );
        }

        if (key.includes('keywords') || key.includes('sources')) {
          return (
            <Form.Item
              key={key}
              name={key}
              label={
                <Space>
                  <Text>{description}</Text>
                  <Tooltip title={`配置项: ${key}`}>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              }
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <TextArea rows={3} placeholder="请用逗号分隔多个项目" />
            </Form.Item>
          );
        }

        return (
          <Form.Item
            key={key}
            name={key}
            label={
              <Space>
                <Text>{description}</Text>
                <Tooltip title={`配置项: ${key}`}>
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
            }
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <SettingOutlined /> 系统设置
        </Title>
        <Text type="secondary">配置AI新闻系统的各项参数和选项</Text>
      </div>

      <Alert
        message="配置说明"
        description="修改配置后请点击保存按钮使配置生效。某些配置可能需要重启服务才能完全生效。"
        type="info"
        icon={<ExclamationCircleOutlined />}
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="基础配置" loading={loading}>
            <Form
              form={form}
              layout="vertical"
              onFinish={saveConfigs}
              autoComplete="off"
            >
              {configs.filter(config => 
                ['max_news_per_fetch', 'fetch_interval_hours', 'enable_auto_fetch'].includes(config.key)
              ).map(renderFormItem)}

              <Divider orientation="left">新闻源配置</Divider>
              
              {configs.filter(config => 
                ['news_sources', 'ai_keywords', 'content_min_length'].includes(config.key)
              ).map(renderFormItem)}

              <Divider orientation="left">系统配置</Divider>
              
              {configs.filter(config => 
                ['enable_duplicate_check', 'log_level'].includes(config.key)
              ).map(renderFormItem)}

              <Form.Item style={{ marginTop: '32px' }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saveLoading}
                  >
                    保存配置
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={resetToDefault}
                  >
                    重置为默认
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={loadConfigs}
                    loading={loading}
                  >
                    重新加载
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="配置说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>获取配置</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                  控制新闻获取的频率和数量
                </Paragraph>
              </div>

              <div>
                <Text strong>新闻源配置</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                  设置新闻来源和筛选条件
                </Paragraph>
              </div>

              <div>
                <Text strong>系统配置</Text>
                <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '8px' }}>
                  系统运行相关的配置选项
                </Paragraph>
              </div>

              <Divider />

              <div>
                <Text strong style={{ color: '#ff4d4f' }}>注意事项</Text>
                <ul style={{ fontSize: '12px', color: 'rgba(0,0,0,0.65)', paddingLeft: '16px' }}>
                  <li>修改获取间隔需要重启定时任务</li>
                  <li>新闻源格式应为有效的域名</li>
                  <li>关键词用英文逗号分隔</li>
                  <li>日志级别影响系统性能</li>
                </ul>
              </div>
            </Space>
          </Card>

          <Card title="系统状态" style={{ marginTop: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>服务状态:</Text>
                <Text style={{ color: '#52c41a' }}>运行中</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>配置版本:</Text>
                <Text>v1.0.0</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text>最后更新:</Text>
                <Text>{new Date().toLocaleString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SystemSettings;