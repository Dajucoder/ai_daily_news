import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Divider,
  Row,
  Col,
  Checkbox,
  message
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

const { Title, Text, Link } = Typography;

interface LoginFormData {
  username: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const onLoginFinish = async (values: LoginFormData) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      
      if (values.remember) {
        localStorage.setItem('remember_login', 'true');
      } else {
        localStorage.removeItem('remember_login');
      }
      
      // 登录成功后跳转到仪表板
      navigate('/dashboard');
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values: RegisterData) => {
    try {
      setLoading(true);
      await register(values);
      
      // 注册成功后跳转到仪表板
      navigate('/dashboard');
    } catch (error) {
      console.error('注册失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const LoginForm = () => (
    <Form
      name="login"
      onFinish={onLoginFinish}
      autoComplete="off"
      size="large"
      initialValues={{
        remember: localStorage.getItem('remember_login') === 'true'
      }}
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名!' },
          { min: 3, message: '用户名至少3个字符' }
        ]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="用户名" 
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码!' },
          { min: 6, message: '密码至少6个字符' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          autoComplete="current-password"
          iconRender={(visible) => 
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住登录</Checkbox>
          </Form.Item>
          <Link onClick={() => message.info('请联系管理员重置密码')}>
            忘记密码？
          </Link>
        </div>
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          style={{ width: '100%', height: '44px' }}
        >
          登录
        </Button>
      </Form.Item>

      <Form.Item>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">还没有账户？</Text>
          <Link onClick={() => setIsLogin(false)} style={{ marginLeft: '8px' }}>
            立即注册
          </Link>
        </div>
      </Form.Item>
    </Form>
  );

  const RegisterForm = () => (
    <Form
      name="register"
      onFinish={onRegisterFinish}
      autoComplete="off"
      size="large"
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="first_name"
            rules={[
              { required: true, message: '请输入姓!' },
              { max: 30, message: '姓名不能超过30个字符' }
            ]}
          >
            <Input placeholder="姓" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="last_name"
            rules={[
              { required: true, message: '请输入名!' },
              { max: 30, message: '姓名不能超过30个字符' }
            ]}
          >
            <Input placeholder="名" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名!' },
          { min: 3, max: 150, message: '用户名长度为3-150个字符' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
        ]}
      >
        <Input 
          prefix={<UserOutlined />} 
          placeholder="用户名" 
          autoComplete="username"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱!' },
          { type: 'email', message: '请输入有效的邮箱地址!' }
        ]}
      >
        <Input 
          prefix={<MailOutlined />} 
          placeholder="邮箱" 
          autoComplete="email"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码!' },
          { min: 8, message: '密码至少8个字符' },
          { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字' }
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          autoComplete="new-password"
          iconRender={(visible) => 
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item
        name="password_confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致!'));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="确认密码"
          autoComplete="new-password"
          iconRender={(visible) => 
            visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
          }
        />
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          style={{ width: '100%', height: '44px' }}
        >
          注册
        </Button>
      </Form.Item>

      <Form.Item>
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">已有账户？</Text>
          <Link onClick={() => setIsLogin(true)} style={{ marginLeft: '8px' }}>
            立即登录
          </Link>
        </div>
      </Form.Item>
    </Form>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: '1200px' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
                      <Card
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  border: 'none',
                  overflow: 'hidden'
                }}
                styles={{ body: { padding: '40px 32px' } }}
              >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                borderRadius: '50%',
                width: '80px',
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 8px 16px rgba(24, 144, 255, 0.3)'
              }}>
                <UserOutlined style={{ fontSize: '32px', color: 'white' }} />
              </div>
              
              <Title level={2} style={{ 
                margin: '0 0 8px',
                background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 'bold'
              }}>
                AI新闻系统
              </Title>
              
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {isLogin ? '欢迎回来，请登录您的账户' : '创建您的新账户'}
              </Text>
            </div>

            <Divider style={{ margin: '24px 0' }} />

            {isLogin ? <LoginForm /> : <RegisterForm />}

            <Divider style={{ margin: '24px 0' }}>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                演示账户: admin / admin123
              </Text>
            </Divider>

            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  登录即表示您同意我们的服务条款和隐私政策
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  © 2024 AI新闻系统. All rights reserved.
                </Text>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
