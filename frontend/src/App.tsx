import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Typography, Space, Avatar, Dropdown, Button, message } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  HistoryOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  StarOutlined,
  BarChartOutlined,
  MessageOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getAvatarUrl } from './services/api';
import Dashboard from './components/Dashboard';
import NewsList from './components/NewsList';
import FetchHistory from './components/FetchHistory';
import SystemSettings from './components/SystemSettings';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import NewsRecommendations from './components/NewsRecommendations';
import NewsAnalytics from './components/NewsAnalytics';
import Chat from './components/Chat';
import AIConfig from './components/AIConfig';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;



const AppContent: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
      path: '/dashboard'
    },
    {
      key: 'news',
      icon: <FileTextOutlined />,
      label: '新闻列表',
      path: '/news'
    },
    {
      key: 'chat',
      icon: <MessageOutlined />,
      label: 'AI聊天',
      path: '/chat'
    },
    {
      key: 'ai-config',
      icon: <ApiOutlined />,
      label: 'AI配置',
      path: '/ai-config'
    },
    {
      key: 'recommendations',
      icon: <StarOutlined />,
      label: '智能推荐',
      path: '/recommendations'
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
      path: '/analytics'
    },
    {
      key: 'history',
      icon: <HistoryOutlined />,
      label: '获取历史',
      path: '/history'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      path: '/settings'
    }
  ];

  // 根据当前路径确定选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    const item = menuItems.find(item => item.path === path);
    return item ? item.key : 'dashboard';
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    const item = menuItems.find(item => item.key === key);
    if (item) {
      navigate(item.path);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  // 用户下拉菜单
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  // 如果在登录页面，不显示布局
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // 如果正在加载认证状态，显示加载界面
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>AI新闻系统</div>
          <div>正在加载...</div>
        </div>
      </div>
    );
  }

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.08)',
          zIndex: 1000,
          background: 'linear-gradient(180deg, #f8f9fa, #e9ecef)'
        }}
      >
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #dee2e6',
          background: 'linear-gradient(135deg, #e3f2fd, #bbdefb)'
        }}>
          <Title 
            level={4} 
            style={{ 
              color: '#1976d2', 
              margin: 0,
              fontSize: collapsed ? '14px' : '16px',
              fontWeight: 'bold'
            }}
          >
            {collapsed ? 'AI' : 'AI新闻系统'}
          </Title>
        </div>
        
        <Menu
          theme="light"
          selectedKeys={[getSelectedKey()]}
          mode="inline"
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            background: 'transparent'
          }}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.label
          }))}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          background: 'linear-gradient(135deg, #fff, #f8f9fa)', 
          padding: '0 24px',
          borderBottom: '1px solid #e8e8e8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <Title level={3} style={{ 
            margin: 0,
            background: 'linear-gradient(135deg, #1890ff, #722ed1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            AI新闻管理系统
          </Title>
          
          <Space size="middle">
            <span style={{ color: '#666' }}>
              欢迎，{user?.first_name || user?.username}
            </span>
            <Dropdown 
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Button type="text" style={{ border: 'none', boxShadow: 'none' }}>
                <Space>
                  <Avatar 
                    size="small" 
                    src={getAvatarUrl(user?.avatar)} 
                    icon={<UserOutlined />}
                    style={{ 
                      background: 'linear-gradient(135deg, #1890ff, #722ed1)',
                      border: '2px solid #f0f0f0'
                    }}
                  />
                  <span>{user?.username}</span>
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: 0, 
          background: '#f5f7fa',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news" element={<NewsList />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/ai-config" element={<AIConfig />} />
            <Route path="/recommendations" element={<NewsRecommendations />} />
            <Route path="/analytics" element={<NewsAnalytics />} />
            <Route path="/history" element={<FetchHistory />} />
            <Route path="/settings" element={<SystemSettings />} />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
