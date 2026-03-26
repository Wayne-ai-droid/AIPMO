import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Switch, Table, Tag, Spin, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, SaveOutlined } from '@ant-design/icons';

const { TabPane } = Tabs;

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('yunxiao');
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    yunxiaoToken: '',
    yunxiaoOrgId: ''
  });

  // 获取当前配置
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfig({
            yunxiaoToken: data.data.yunxiaoToken || '',
            yunxiaoOrgId: data.data.yunxiaoOrgId || ''
          });
        }
      })
      .catch(err => {
        console.error('获取配置失败:', err);
      });
  }, []);

  const handleSaveConfig = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      if (result.success) {
        message.success('配置保存成功！');
        setConfig(values);
        
        // 立即从云效获取一次数据
        await syncDataFromYunxiao();
      } else {
        message.error('配置保存失败：' + (result.message || '未知错误'));
      }
    } catch (error) {
      message.error('网络请求失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  const syncDataFromYunxiao = async () => {
    message.loading({ content: '正在从云效同步数据...', key: 'sync' });
    try {
      const response = await fetch('/api/sync/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      const result = await response.json();
      if (result.success) {
        message.success({ content: '数据同步完成！', key: 'sync' });
      } else {
        message.error({ content: '数据同步失败：' + (result.message || '未知错误'), key: 'sync' });
      }
    } catch (error) {
      message.error({ content: '同步请求失败，请检查网络连接', key: 'sync' });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>配置中心</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="云效配置" key="yunxiao">
          <Card title="云效API配置" style={{ marginBottom: 24 }}>
            <p style={{ color: '#666', marginBottom: 16 }}>
              配置云效Token和组织ID，用于同步项目数据
            </p>
            <Form
              layout="vertical"
              onFinish={handleSaveConfig}
              initialValues={config}
            >
              <Form.Item
                label="云效Token"
                name="yunxiaoToken"
                rules={[{ required: true, message: '请输入云效Token' }]}
              >
                <Input.Password placeholder="pt-fp0mbOxHhsplobOXhLDeiWW1_6155f38a-7ea6-47b6-9274-56447618cae1" />
              </Form.Item>
              
              <Form.Item
                label="云效组织ID"
                name="yunxiaoOrgId"
                rules={[{ required: true, message: '请输入云效组织ID' }]}
              >
                <Input placeholder="6925baaef9c52e7d8c27b51b" />
              </Form.Item>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<SaveOutlined />}
                  loading={loading}
                >
                  保存并同步数据
                </Button>
                <Button 
                  type="default" 
                  onClick={syncDataFromYunxiao}
                  icon={<SyncOutlined />}
                  style={{ marginLeft: 8 }}
                >
                  仅同步数据
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="项目配置" key="projects">
          <Card title="项目管理">
            <p style={{ color: '#666', marginBottom: 16 }}>
              管理已同步的项目和绑定配置
            </p>
            {/* 这里可以添加项目管理表格 */}
            <p>项目配置功能将在保存云效配置后自动启用</p>
          </Card>
        </TabPane>
        
        <TabPane tab="监控指标" key="metrics">
          <Card title="健康度指标">
            <p style={{ color: '#666', marginBottom: 16 }}>
              配置项目健康度计算规则和阈值
            </p>
            {/* 监控指标配置 */}
            <p>监控指标配置</p>
          </Card>
        </TabPane>
        
        <TabPane tab="通知设置" key="notifications">
          <Card title="通知渠道">
            <p style={{ color: '#666', marginBottom: 16 }}>
              配置飞书、邮件等通知渠道
            </p>
            {/* 通知设置 */}
            <p>通知设置</p>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Settings;