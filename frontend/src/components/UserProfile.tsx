import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Upload,
  message,
  Modal,
  Switch,
  Select,
  Statistic
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  CameraOutlined,
  LockOutlined,
  SettingOutlined,
  CalendarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import authService, { UserStats } from '../services/authService';
import { User } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const UserProfile: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userSettings, setUserSettings] = useState<any>(user?.profile || {});
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [settingsForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
      loadUserStats();
      // 初始化用户设置状态，但不设置表单值
      loadUserSettings();
    }
  }, [user, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserStats = async () => {
    try {
      const stats = await authService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('获取用户统计失败:', error);
    }
  };

  const loadUserSettings = async () => {
    try {
      const settings = await authService.getUserSettings();
      setUserSettings(settings);
      return settings;
    } catch (error) {
      console.error('获取用户设置失败:', error);
      return null;
    }
  };

  const handleOpenSettings = async () => {
    setSettingsModalVisible(true);
    const settings = await loadUserSettings();
    if (settings) {
      // 等待下一个渲染周期，确保Form已经挂载
      setTimeout(() => {
        settingsForm.setFieldsValue(settings);
      }, 0);
    }
  };

  const handleProfileUpdate = async (values: Partial<User>) => {
    try {
      setLoading(true);
      await updateProfile(values);
      setEditMode(false);
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('更新个人信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    try {
      setLoading(true);
      await authService.changePassword(values);
      setPasswordModalVisible(false);
      passwordForm.resetFields();
      message.success('密码修改成功');
    } catch (error: any) {
      const errorMessage = error.old_password?.[0] || error.new_password?.[0] || error.message || '修改密码失败';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (values: any) => {
    try {
      setLoading(true);
      const updatedSettings = await authService.updateUserSettings(values);
      setUserSettings(updatedSettings);
      setSettingsModalVisible(false);
      message.success('设置更新成功');
    } catch (error: any) {
      message.error(error.message || '更新设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    
    if (info.file.status === 'done') {
      // 获取上传后的图片URL
      const imageUrl = info.file.response?.url;
      
      if (imageUrl) {
        // 头像已通过API上传成功，刷新用户信息
        loadUserStats();
        message.success('头像上传成功');
      } else {
        message.error('头像上传失败：未获取到图片URL');
      }
      setLoading(false);
    } else if (info.file.status === 'error') {
      message.error('头像上传失败');
      setLoading(false);
    }
  };

  // 上传前的验证
  const beforeUpload = (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG 格式的图片!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!');
      return false;
    }
    return true;
  };

  // 真实的头像上传函数
  const customUpload = async ({ file, onSuccess, onError }: any) => {
    try {
      const result = await authService.uploadAvatar(file);
      onSuccess({ url: result.avatar_url });
    } catch (error: any) {
      console.error('头像上传失败:', error);
      onError(error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[24, 24]}>
        {/* 用户基本信息卡片 */}
        <Col xs={24} lg={8}>
          <Card
            style={{ textAlign: 'center', borderRadius: '12px' }}
            styles={{ body: { padding: '32px 24px' } }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  size={120}
                  src={user.avatar}
                  icon={<UserOutlined />}
                  style={{
                    border: '4px solid #f0f0f0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Upload
                  showUploadList={false}
                  onChange={handleAvatarChange}
                  beforeUpload={beforeUpload}
                  customRequest={customUpload}
                  accept="image/*"
                >
                  <Button
                    icon={<CameraOutlined />}
                    shape="circle"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                  />
                </Upload>
              </div>

              <div>
                <Title level={3} style={{ margin: '0 0 8px' }}>
                  {user.first_name} {user.last_name}
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  @{user.username}
                </Text>
              </div>

              {user.bio && (
                <Paragraph style={{ margin: 0, color: '#666' }}>
                  {user.bio}
                </Paragraph>
              )}

              <Space size="large">
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>
                    {userStats?.user_joined_days || 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>加入天数</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
                    {userStats?.total_news || 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: '12px' }}>新闻总数</Text>
                </div>
              </Space>

              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditMode(true)}
                >
                  编辑资料
                </Button>
                <Button
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                >
                  修改密码
                </Button>
                <Button
                  icon={<SettingOutlined />}
                  onClick={handleOpenSettings}
                >
                  设置
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* 详细信息和统计 */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 统计卡片 */}
            {userStats && (
              <Card title="统计概览" style={{ borderRadius: '12px' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="总新闻数"
                      value={userStats.total_news}
                      prefix={<TrophyOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="加入天数"
                      value={userStats.user_joined_days}
                      prefix={<CalendarOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="用户名"
                      value={userStats.username}
                      valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={12} sm={6}>
                    <Statistic
                      title="注册时间"
                      value={new Date(userStats.join_date).toLocaleDateString()}
                      valueStyle={{ color: '#fa8c16', fontSize: '16px' }}
                    />
                  </Col>
                </Row>
              </Card>
            )}

            {/* 个人信息卡片 */}
            <Card title="个人信息" style={{ borderRadius: '12px' }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
                disabled={!editMode}
              >
                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item label="姓" name="first_name">
                      <Input placeholder="请输入姓" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="名" name="last_name">
                      <Input placeholder="请输入名" />
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item label="邮箱" name="email">
                  <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
                </Form.Item>
                
                <Form.Item label="手机号" name="phone">
                  <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
                </Form.Item>
                
                <Form.Item label="个人简介" name="bio">
                  <TextArea rows={4} placeholder="介绍一下你自己吧..." />
                </Form.Item>

                {editMode && (
                  <Form.Item>
                    <Space>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        保存
                      </Button>
                      <Button onClick={() => setEditMode(false)}>
                        取消
                      </Button>
                    </Space>
                  </Form.Item>
                )}
              </Form>
            </Card>
          </Space>
        </Col>
      </Row>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          <Form.Item
            label="当前密码"
            name="old_password"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            label="新密码"
            name="new_password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8个字符' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            label="确认新密码"
            name="new_password_confirm"
            dependencies={['new_password']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setPasswordModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置模态框 */}
      <Modal
        title="用户设置"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={settingsForm}
          layout="vertical"
          onFinish={handleSettingsUpdate}
          initialValues={userSettings}
        >
          <Form.Item label="主题" name="theme">
            <Select placeholder="选择主题">
              <Option value="light">浅色主题</Option>
              <Option value="dark">深色主题</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="语言" name="language">
            <Select placeholder="选择语言">
              <Option value="zh-cn">中文</Option>
              <Option value="en">English</Option>
            </Select>
          </Form.Item>

          <Divider />

          <Form.Item label="启用通知" name="notifications_enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="邮件通知" name="email_notifications" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setSettingsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存设置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
