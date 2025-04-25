import React, { useState } from 'react';
import { Form, Input, Button, message, Spin, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new URLSearchParams();
      formData.append('username', values.username);
      formData.append('password', values.password);

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
        formData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('username', values.username);
        message.success('Login successful!');
        navigate('/chat');
      }
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            setError('Invalid username or password');
            break;
          case 422:
            setError('Please enter valid username and password');
            break;
          case 500:
            setError('Server error, please try again later');
            break;
          default:
            setError('Login failed, please check your network connection');
        }
      } else {
        setError('Network error, please check your connection');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      background: '#f0f2f5'
    }}>
      <div style={{ 
        width: 400, 
        padding: '40px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Login</h2>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}
        <Spin spinning={loading}>
          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Please input your username' },
                { min: 3, message: 'Username must be at least 3 characters' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Please input your password' },
                { min: 6, message: 'Password must be at least 6 characters' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Password" 
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block
                size="large"
                loading={loading}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default Login; 