import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Menu, Typography, Space } from 'antd';
import { 
  DashboardOutlined, 
  FileTextOutlined, 
  HistoryOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import Dashboard from './components/Dashboard';
import NewsList from './components/NewsList';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState('dashboard');

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

  const handleMenuClick = ({ key }: { key: string }) => {
    setSelectedKey(key);
  };

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider 
          collapsible 
          collapsed={collapsed} 
          onCollapse={setCollapsed}
          theme="dark"
        >
          <div style={{ 
            height: '64px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: '1px solid #303030'
          }}>
            <Title 
              level={4} 
              style={{ 
                color: 'white', 
                margin: 0,
                fontSize: collapsed ? '14px' : '16px'
              }}
            >
              {collapsed ? 'AI' : 'AI新闻系统'}
            </Title>
          </div>
          
          <Menu
            theme="dark"
            selectedKeys={[selectedKey]}
            mode="inline"
            onClick={handleMenuClick}
            items={menuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: (
                <a href={item.path} onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState(null, '', item.path);
                  setSelectedKey(item.key);
                }}>
                  {item.label}
                </a>
              )
            }))}
          />
        </Sider>
        
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Space>
              <Title level={3} style={{ margin: 0 }}>
                AI新闻管理系统
              </Title>
            </Space>
          </Header>
          
          <Content style={{ 
            margin: 0, 
            background: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)'
          }}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/news" element={<NewsList />} />
              <Route path="/history" element={<div style={{ padding: '24px' }}>获取历史页面开发中...</div>} />
              <Route path="/settings" element={<div style={{ padding: '24px' }}>系统设置页面开发中...</div>} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;