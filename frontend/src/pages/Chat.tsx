import React, { useState, useEffect, useRef } from 'react';
import { Layout, Input, Button, List, Avatar, message, Menu, Modal, Form, Input as AntInput } from 'antd';
import { SendOutlined, UserOutlined, RobotOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Sider } = Layout;
const { SubMenu } = Menu;

interface Message {
  id?: number;
  role: 'user' | 'assistant' | 'bot';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: number;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 加载用户的会话列表
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      console.log('Start fetching conversations...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Fetched' : 'Not fetched');
      
      const response = await axios.get('http://localhost:8000/api/conversations', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Conversations fetched successfully:', response.data);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config
        });
      }
      message.error('Failed to fetch conversations');
    }
  };

  const handleCreateConversation = async () => {
    try {
      console.log('Creating new conversation...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Fetched' : 'Not fetched');
      
      const response = await axios.post(
        'http://localhost:8000/api/conversations', 
        { title: 'New Conversation' },  // 使用默认标题
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Conversation created successfully:', response.data);
      setConversations([...conversations, response.data]);
      setSelectedConversation(response.data.id);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: error.config
        });
      }
      message.error('Error creating conversation');
    }
  };

  const handleSelectConversation = (id: number) => {
    setSelectedConversation(id);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) {
      message.warning('Please enter a message');
      return;
    }

    if (!selectedConversation) {
      message.warning('Please select a conversation or create a new one');
      return;
    }

    const newMessage: Message = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      console.log('Sending message...');
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Fetched' : 'Not fetched');
      
      const response = await axios.post(
        `http://localhost:8000/api/chat/messages/${selectedConversation}`,
        { 
          content: input,
          role: 'user'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Message sent successfully:', response.data);
      
      const botMessage: Message = {
        id: Date.now() + 1,
        content: response.data.content,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // 当对话消息达到3条时，自动更新标题
      if (finalMessages.length + 2 >= 3) {
        try {
          const summaryResponse = await axios.post(
            `http://localhost:8000/api/chat/${selectedConversation}/summarize`,
            {},
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
          );
          
          if (summaryResponse.data.title) {
            // 更新本地对话列表中的标题
            setConversations(prev => 
              prev.map(conv => 
                conv.id === selectedConversation 
                  ? { ...conv, title: summaryResponse.data.title }
                  : conv
              )
            );
          }
        } catch (error) {
          console.error('Failed to update conversation title:', error);
        }
      }
    } catch (error: any) {
      if (error.response) {
        switch (error.response.status) {
          case 401:
            message.error('Login expired, please log in again');
            navigate('/login');
            break;
          case 404:
            message.error('Conversation does not exist or has been deleted');
            break;
          case 500:
            message.error('Server error, please try again later');
            break;
          default:
            message.error('Failed to send message, please check your network connection');
        }
      } else {
        message.error('Network error, please check your network connection');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={300} style={{ background: '#fff' }}>
        <div style={{ padding: '20px' }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreateConversation}
            loading={conversationLoading}
            block
          >
            New Conversation
          </Button>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedConversation ? [selectedConversation.toString()] : []}
        >
          {conversations.map(conv => (
            <Menu.Item 
              key={conv.id}
              onClick={() => handleSelectConversation(conv.id)}
            >
              {conv.title}
            </Menu.Item>
          ))}
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 20px' }}>
          <h2>{selectedConversation ? conversations.find(c => c.id === selectedConversation)?.title || 'Select or create a conversation' : 'Select or create a conversation'}</h2>
        </Header>
        <Content style={{ padding: '20px', background: '#fff' }}>
          {selectedConversation ? (
            <>
              <List
                dataSource={messages}
                renderItem={item => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={item.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
                          style={{ backgroundColor: item.role === 'user' ? '#1890ff' : '#52c41a' }}
                        />
                      }
                      title={item.role === 'user' ? 'Me' : 'Bot'}
                      description={item.content}
                    />
                  </List.Item>
                )}
              />
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <h3>Please select or create a conversation</h3>
            </div>
          )}
        </Content>
        {selectedConversation && (
          <div style={{ padding: '20px', background: '#fff' }}>
            <Input.Group compact>
              <Input
                style={{ width: 'calc(100% - 100px)' }}
                value={input}
                onChange={e => setInput(e.target.value)}
                onPressEnter={handleSendMessage}
                placeholder="Enter message..."
                disabled={loading}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={loading}
                style={{ width: '100px' }}
              >
                Send
              </Button>
            </Input.Group>
          </div>
        )}
      </Layout>
    </Layout>
  );
};

export default Chat; 