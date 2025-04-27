import React, { useState, useEffect } from 'react';
import Layout from 'antd/lib/layout';
import Card from 'antd/lib/card';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';
import Statistic from 'antd/lib/statistic';
import Upload from 'antd/lib/upload';
import Button from 'antd/lib/button';
import message from 'antd/lib/message';
import Table from 'antd/lib/table';
import Alert from 'antd/lib/alert';
import Tabs from 'antd/lib/tabs';
import Input from 'antd/lib/input';
import Form from 'antd/lib/form';
import Modal from 'antd/lib/modal';
import type { UploadProps } from 'antd/lib/upload';
import { UserOutlined, MessageOutlined, RobotOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Content } = Layout;
const { TabPane } = Tabs;

interface User {
  username: string;
  password: string;
  is_admin: boolean;
}

interface ImportResult {
  success: User[];
  failed: {
    user: User;
    error: string;
  }[];
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  user_id: number;
  username: string;
}

const Admin: React.FC = () => {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isAddUserModalVisible, setIsAddUserModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to fetch users');
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setConversations(response.data);
    } catch (error) {
      message.error('Failed to fetch conversations');
    }
  };

  const handleAddUser = async (values: any) => {
    try {
      await axios.post('http://localhost:8000/api/users', values, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      message.success('User created successfully');
      setIsAddUserModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error) {
      message.error('Failed to create user');
    }
  };

  const props: UploadProps = {
    name: 'file',
    accept: '.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const users: User[] = [];
          
          // Skip header row
          for (let i = 1; i < lines.length; i++) {
            const [username, password, is_admin] = lines[i].split(',');
            if (username && password) {
              users.push({
                username: username.trim(),
                password: password.trim(),
                is_admin: is_admin?.trim().toLowerCase() === 'true'
              });
            }
          }

          setLoading(true);
          const response = await axios.post(
            'http://localhost:8000/api/users/bulk',
            { users },
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            }
          );

          setImportResult(response.data);
          if (response.data.failed.length === 0) {
            message.success('All users created successfully');
          } else if (response.data.success.length > 0) {
            message.warning('Some users failed to create');
          } else {
            message.error('Failed to create users');
          }
          fetchUsers();
        } catch (error) {
          message.error('Failed to process file');
          console.error('Error processing file:', error);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
      return false;
    },
  };

  const userColumns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Is Admin',
      dataIndex: 'is_admin',
      key: 'is_admin',
      render: (isAdmin: boolean) => (isAdmin ? 'Yes' : 'No'),
    },
  ];

  const conversationColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
    },
  ];

  return (
    <Content style={{ padding: '24px', minHeight: 280 }}>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Users"
              value={users.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Conversations"
              value={conversations.length}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Bots"
              value={1}
              prefix={<RobotOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="1" style={{ marginTop: '24px' }}>
        <TabPane tab="User Management" key="1">
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddUserModalVisible(true)}
                style={{ marginRight: '16px' }}
              >
                Add User
              </Button>
              <Upload {...props}>
                <Button icon={<UploadOutlined />} loading={loading}>
                  Import Users
                </Button>
              </Upload>
            </div>

            <Alert
              message="CSV Format"
              description="Please upload a CSV file with the following columns: username, password, is_admin (true/false)"
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {importResult && (
              <div style={{ marginTop: '24px' }}>
                <Alert
                  message={`Successfully created ${importResult.success.length} users`}
                  type="success"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />
                {importResult.failed.length > 0 && (
                  <>
                    <Alert
                      message={`Failed to create ${importResult.failed.length} users`}
                      type="error"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    <Table
                      columns={[
                        {
                          title: 'Username',
                          dataIndex: ['user', 'username'],
                          key: 'username',
                        },
                        {
                          title: 'Error',
                          dataIndex: 'error',
                          key: 'error',
                        },
                      ]}
                      dataSource={importResult.failed}
                      rowKey={(record) => record.user.username}
                      pagination={false}
                    />
                  </>
                )}
              </div>
            )}

            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="username"
              style={{ marginTop: '24px' }}
            />
          </Card>
        </TabPane>

        <TabPane tab="Conversation History" key="2">
          <Card>
            <Table
              columns={conversationColumns}
              dataSource={conversations}
              rowKey="id"
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title="Add User"
        open={isAddUserModalVisible}
        onCancel={() => setIsAddUserModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleAddUser}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input username' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input password' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="is_admin"
            label="Is Admin"
            valuePropName="checked"
          >
            <Input type="checkbox" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create User
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Content>
  );
};

export default Admin; 