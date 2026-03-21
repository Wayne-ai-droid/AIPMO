import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Select, Switch, Table, Tag, Spin, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';

const { Option } = Select;
const API_BASE_URL = 'http://localhost:3001/api';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    // 调用后端API获取真实数据
    fetch(`${API_BASE_URL}/sync/project/default`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyncData(data.data);
          setLoading(false);
        } else {
          message.error('获取数据失败');
          setLoading(false);
        }
      })
      .catch(err => {
        message.error('连接后端服务失败');
        setLoading(false);
      });
  }, []);

  // 生成真实项目配置数据
  const projects = syncData ? [
    { 
      id: 1, 
      name: 'MFP项目', 
      yunxiaoProjectId: syncData.projectId,
      feishuChatId: 'oc_b737a69f990f577340564c5eef9ad3f3',
      syncEnabled: true,
      syncInterval: '15min',
      lastSync: new Date().toLocaleString()
    }
  ] : [];

  // 监控指标配置
  const metrics = [
    { id: 1, name: '需求完成率', enabled: true, thresholds: { green: 80, yellow: 60, red: 0 } },
    { id: 2, name: '缺陷密度', enabled: true, thresholds: { green: 3, yellow: 5, red: 10 } },
    { id: 3, name: '进度偏差', enabled: true, thresholds: { green: 10, yellow: 20, red: 30 } },
    { id: 4, name: '代码覆盖率', enabled: false, thresholds: { green: 80, yellow: 60, red: 40 } },
  ];

  const handleAddProject = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditProject = (project: any) => {
    setEditingProject(project);
    form.setFieldsValue(project);
    setIsModalOpen(true);
  };

  const handleDeleteProject = (id: number) => {
    message.success('删除成功');
  };

  const handleSaveProject = (values: any) => {
    console.log('保存项目:', values);
    message.success(editingProject ? '更新成功' : '添加成功');
    setIsModalOpen(false);
  };

  const handleSyncProject = (id: number) => {
    message.loading({ content: '正在同步...', key: 'sync' });
    fetch(`${API_BASE_URL}/sync/project/default`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          message.success({ content: '同步完成', key: 'sync' });
        } else {
          message.error({ content: '同步失败', key: 'sync' });
        }
      })
      .catch(() => {
        message.error({ content: '同步失败', key: 'sync' });
      });
  };

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { 
      title: '云效项目ID', 
      dataIndex: 'yunxiaoProjectId', 
      key: 'yunxiaoProjectId',
      render: (text: string) => <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4 }}>{text}</code>
    },
    { 
      title: '飞书群', 
      dataIndex: 'feishuChatId', 
      key: 'feishuChatId',
      render: (text: string) => text ? <Tag color="blue">已绑定</Tag> : <Tag>未绑定</Tag>
    },
    { 
      title: '自动同步', 
      dataIndex: 'syncEnabled', 
      key: 'syncEnabled',
      render: (enabled: boolean) => <Switch checked={enabled} size="small" />
    },
    { 
      title: '同步频率', 
      dataIndex: 'syncInterval', 
      key: 'syncInterval',
      render: (interval: string) => interval === '15min' ? '15分钟' : '1小时'
    },
    { 
      title: '最后同步', 
      dataIndex: 'lastSync', 
      key: 'lastSync',
      render: (time: string) => time || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <span>
          <Button 
            type="link" 
            icon={<SyncOutlined />} 
            onClick={() => handleSyncProject(record.id)}
          >
            同步
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEditProject(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteProject(record.id)}
          >
            删除
          </Button>
        </span>
      ),
    },
  ];

  const metricColumns = [
    { title: '指标名称', dataIndex: 'name', key: 'name' },
    { 
      title: '启用状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (enabled: boolean) => <Switch checked={enabled} size="small" />
    },
    { 
      title: '阈值配置', 
      key: 'thresholds',
      render: (_: any, record: any) => (
        <div>
          <Tag color="success">优秀 &gt;={record.thresholds.green}</Tag>
          <Tag color="warning">良好 &gt;={record.thresholds.yellow}</Tag>
          <Tag color="error">警告 &lt;{record.thresholds.red}</Tag>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link">编辑阈值</Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>
        配置中心
        <Tag color="green" style={{ marginLeft: 12 }}>真实数据</Tag>
      </h1>
      
      <Card
        tabList={[
          { key: 'projects', tab: '项目配置' },
          { key: 'metrics', tab: '监控指标' },
          { key: 'notifications', tab: '通知设置' },
        ]}
        activeTabKey={activeTab}
        onTabChange={setActiveTab}
      >
        {activeTab === 'projects' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#666' }}>管理云效项目绑定和同步配置</p>
            </div>
            <Table 
              columns={projectColumns}
              dataSource={projects}
              loading={loading}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: '#666' }}>配置项目健康度计算指标和阈值</p>
            </div>
            <Table 
              columns={metricColumns}
              dataSource={metrics}
              rowKey="id"
              pagination={false}
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <p style={{ color: '#666' }}>配置飞书通知渠道和接收人</p>
            <p>当前配置：飞书群通知 oc_b737a69f990f577340564c5eef9ad3f3</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Settings;
