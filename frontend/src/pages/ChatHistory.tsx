import React, { useState, useEffect } from 'react';
import { Table, Select, Space, Typography } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title } = Typography;

interface Message {
  id: number;
  content: string;
  role: string;
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  messages: Message[];
}

interface User {
  id: number;
  username: string;
}

const ChatHistory: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchConversations(selectedUserId);
    }
  }, [selectedUserId]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8000/api/users/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchConversations = async (userId: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:8000/api/conversations/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Chat Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Created Time',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: 'Message Count',
      key: 'message_count',
      render: (_: any, record: Conversation) => record.messages.length,
    },
  ];

  const expandedRowRender = (record: Conversation) => {
    return (
      <div style={{ padding: '16px' }}>
        {record.messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: '8px',
              padding: '8px',
              backgroundColor: message.role === 'user' ? '#f0f0f0' : '#e6f7ff',
              borderRadius: '4px',
            }}
          >
            <Space>
              {message.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              <span>{message.content}</span>
            </Space>
            <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
              {new Date(message.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Title level={4}>Chat History</Title>
      <div style={{ marginBottom: '16px' }}>
        <Select
          style={{ width: 200 }}
          placeholder="Select User"
          onChange={(value) => setSelectedUserId(value)}
          options={users.map(user => ({
            label: user.username,
            value: user.id
          }))}
        />
      </div>
      <Table
        columns={columns}
        dataSource={conversations}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender,
        }}
      />
    </div>
  );
};

export default ChatHistory; 