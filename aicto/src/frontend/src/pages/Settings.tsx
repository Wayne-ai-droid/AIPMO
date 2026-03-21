import React, { useState } from 'react';
import { Card, Form, Input, Button, Select, Switch, Table, Tag, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined } from '@ant-design/icons';

const { Option } = Select;

// 模拟项目配置数据
const mockProjects = [
  { 
    id: 1, 
    name: '电商中台重构', 
    yunxiaoProjectId: 'proj-001',
    feishuChatId: 'oc_xxx1',
    syncEnabled: true,
    syncInterval: '15min',
    lastSync: '2026-03-19 10:30:00'
  },
  { 
    id: 2, 
    name: '支付系统升级', 
    yunxiaoProjectId: 'proj-002',
    feishuChatId: 'oc_xxx2',
    syncEnabled: true,
    syncInterval: '15min',
    lastSync: '2026-03-19 10:15:00'
  },
  { 
    id: 3, 
    name: '用户中心V2', 
    yunxiaoProjectId: 'proj-003',
    feishuChatId: null,
    syncEnabled: false,
    syncInterval: '1hour',
    lastSync: null
  },
];

// 模拟监控指标配置
const mockMetrics = [
  { id: 1, name: '需求完成率', enabled: true, thresholds: { green: 80, yellow: 60, red: 0 } },
  { id: 2, name: '缺陷密度', enabled: true, thresholds: { green: 3, yellow: 5, red: 10 } },
  { id: 3, name: '进度偏差', enabled: true, thresholds: { green: 10, yellow: 20, red: 30 } },
  { id: 4, name: '代码覆盖率', enabled: false, thresholds: { green: 80, yellow: 60, red: 40 } },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [form] = Form.useForm();

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
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，是否继续？',
      onOk() {
        message.success('删除成功');
      },
    });
  };

  const handleSaveProject = (values: any) => {
    console.log('保存项目:', values);
    message.success(editingProject ? '更新成功' : '添加成功');
    setIsModalOpen(false);
  };

  const handleSyncProject = (id: number) => {
    message.loading({ content: '正在同步...', key: 'sync' });
    setTimeout(() => {
      message.success({ content: '同步完成', key: 'sync' });
    }, 2000);
  };

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { 
      title: '云效项目ID', 
      dataIndex: 'yunxiaoProjectId', 
      key: 'yunxiaoProjectId',
      render: (text: string) => <code>{text}</code>
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
      render: (enabled: boolean) => (
        <Switch 
          checked={enabled} 
          checkedChildren="开启" 
          unCheckedChildren="关闭"
        />
      )
    },
    { 
      title: '同步频率', 
      dataIndex: 'syncInterval', 
      key: 'syncInterval',
      render: (text: string) => ({
        '15min': '15分钟',
        '1hour': '1小时',
        '1day': '1天'
      })[text] || text
    },
    { 
      title: '最后同步', 
      dataIndex: 'lastSync', 
      key: 'lastSync',
      render: (text: string) => text || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <div>
          <Button 
            type="text" 
            icon={<SyncOutlined />} 
            onClick={() => handleSyncProject(record.id)}
          >
            同步
          </Button>
          <Button 
            type="text" 
            icon={<EditOutlined />} 
            onClick={() => handleEditProject(record)}
          >
            编辑
          </Button>
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProject(record.id)}
          >
            删除
          </Button>
        </div>
      ),
    },
  ];

  const metricColumns = [
    { title: '指标名称', dataIndex: 'name', key: 'name' },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (enabled: boolean) => (
        <Switch 
          checked={enabled} 
          checkedChildren="启用" 
          unCheckedChildren="禁用"
        />
      )
    },
    { 
      title: '阈值配置', 
      key: 'thresholds',
      render: (_: any, record: any) => (
        <div>
          <Tag color="success">优秀 ≥{record.thresholds.green}</Tag>
          <Tag color="warning">良好 ≥{record.thresholds.yellow}</Tag>
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
      <h1>配置中心</h1>

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
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
              <span>管理云效项目绑定和同步配置</span>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProject}>
                添加项目
              </Button>
            </div>
            <Table 
              columns={projectColumns} 
              dataSource={mockProjects}
              rowKey="id"
            />
          </div>
        )}

        {activeTab === 'metrics' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <span>配置项目健康度计算指标和预警阈值</span>
            </div>
            <Table 
              columns={metricColumns} 
              dataSource={mockMetrics}
              rowKey="id"
            />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div>
            <Form layout="vertical">
              <Form.Item label="飞书通知开关">
                <Switch defaultChecked />
              </Form.Item>
              
              <Form.Item label="通知频率">
                <Select defaultValue="realtime" style={{ width: 200 }}>
                  <Option value="realtime">实时通知</Option>
                  <Option value="hourly">每小时汇总</Option>
                  <Option value="daily">每日汇总</Option>
                </Select>
              </Form.Item>

              <Form.Item label="风险等级通知">
                <Select mode="multiple" defaultValue={['high', 'medium']} style={{ width: 400 }}>
                  <Option value="high">🔴 高风险</Option>
                  <Option value="medium">🟡 中风险</Option>
                  <Option value="low">🔵 低风险</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary">保存设置</Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Card>

      <Modal
        title={editingProject ? '编辑项目' : '添加项目'}
        open={isModalOpen}
        onOk={() => form.submit()}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical"
          onFinish={handleSaveProject}
        >
          <Form.Item
            label="项目名称"
            name="name"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="例如：电商中台重构" />
          </Form.Item>

          <Form.Item
            label="云效项目ID"
            name="yunxiaoProjectId"
            rules={[{ required: true, message: '请输入云效项目ID' }]}
          >
            <Input placeholder="例如：proj-xxx" />
          </Form.Item>

          <Form.Item
            label="飞书群ID"
            name="feishuChatId"
          >
            <Input placeholder="例如：oc_xxx（可选）" />
          </Form.Item>

          <Form.Item
            label="自动同步"
            name="syncEnabled"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="同步频率"
            name="syncInterval"
            initialValue="15min"
          >
            <Select>
              <Option value="15min">15分钟</Option>
              <Option value="1hour">1小时</Option>
              <Option value="1day">1天</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;
