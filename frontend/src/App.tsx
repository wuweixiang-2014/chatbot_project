import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout, Menu, message, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, LogoutOutlined, RobotOutlined, TeamOutlined } from '@ant-design/icons';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
import axios from 'axios';
import './App.css';

const { Header, Content, Sider } = Layout;

interface Role {
  id: number;
  name: string;
  permissions?: string[];
}

interface User {
  id: number;
  username: string;
  is_admin: boolean;
  roles: Role[];
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo();
    } else {
      setLoading(false);
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    message.success('已退出登录');
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  if (loading) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Chatbot System</div>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar style={{ backgroundColor: '#1890ff' }}>
              {user?.username.charAt(0).toUpperCase()}
            </Avatar>
            <span style={{ color: 'white' }}>{user?.username}</span>
          </Space>
        </Dropdown>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['/chat']}
            style={{ height: '100%', borderRight: 0 }}
            onClick={handleMenuClick}
          >
            <Menu.Item key="/chat" icon={<RobotOutlined />}>
              Chat
            </Menu.Item>
            {user?.is_admin && (
              <Menu.Item key="/admin" icon={<TeamOutlined />}>
                Admin
              </Menu.Item>
            )}
          </Menu>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content>
            <Routes>
              <Route path="/chat" element={<Chat />} />
              {user?.is_admin && <Route path="/admin" element={<Admin />} />}
              <Route path="*" element={<Navigate to="/chat" replace />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<Navigation />} />
      </Routes>
    </Router>
  );
};

export default App;
