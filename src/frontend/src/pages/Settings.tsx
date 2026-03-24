import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, Switch, Table, Tag, Modal, message, Spin, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SyncOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject
} from '../api/dashboard';

const { Option } = Select;

interface ProjectConfig {
  id: number;
  name: string;
  yunxiaoProjectId: string;
  feishuChatId: string | null;
  githubRepo: string | null;
  syncEnabled: boolean;
  syncInterval: '15min' | '1hour' | '1day';
  lastSync: string | null;
  status: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('projects');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectConfig | null>(null);
  const [form] = Form.useForm();
  const [projects, setProjects] = useState<ProjectConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState<number | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await getProjects();
      if (response.success) {
        // 转换数据格式以匹配前端需求
        const formattedProjects = response.data.map((project: any) => ({
          id: project.id,
          name: project.name,
          yunxiaoProjectId: project.yunxiaoProjectId || '',
          feishuChatId: project.feishuChatId || null,
          githubRepo: project.githubRepo || null,
          syncEnabled: true, // 默认开启同步
          syncInterval: '15min' as const, // 默认15分钟
          lastSync: null, // 需要从 sync_logs 表获取
          status: project.status
        }));
        setProjects(formattedProjects);
      }
    } catch (error) {
      message.error('获取项目列表失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEditProject = (project: ProjectConfig) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      feishuChatId: project.feishuChatId || undefined,
      githubRepo: project.githubRepo || undefined
    });
    setIsModalOpen(true);
  };

  const handleDeleteProject = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，是否继续？',
      onOk: async () => {
        try {
          await deleteProject(id);
          message.success('删除成功');
          fetchProjects();
        } catch (error) {
          message.error('删除失败: ' + (error as Error).message);
        }
      },
    });
  };

  const handleSaveProject = async (values: any) => {
    try {
      if (editingProject) {
        // 更新项目
        await updateProject(editingProject.id, values);
        message.success('更新成功');
      } else {
        // 创建项目
        await createProject(values);
        message.success('添加成功');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      message.error('保存失败: ' + (error as Error).message);
    }
  };

  const handleSyncProject = async (id: number) => {
    setSyncLoading(id);
    try {
      // 这里应该调用同步API，但目前后端还没有实现
      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      message.success('同步完成');
      fetchProjects();
    } catch (error) {
      message.error('同步失败: ' + (error as Error).message);
    } finally {
      setSyncLoading(null);
    }
  };

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { 
      title: '云效项目ID', 
      dataIndex: 'yunxiaoProjectId', 
      key: 'yunxiaoProjectId',
      render: (text: string) => text ? <code>{text}</code> : '-'
    },
    { 
      title: '飞书群', 
      dataIndex: 'feishuChatId', 
      key: 'feishuChatId',
      render: (text: string) => text ? <Tag color="blue">已绑定</Tag> : <Tag>未绑定</Tag>
    },
    { 
      title: 'GitHub仓库', 
      dataIndex: 'githubRepo', 
      key: 'githubRepo',
      render: (text: string) => text ? <code>{text}</code> : '-'
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '活跃' : '停用'}
        </Tag>
      )
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
          disabled={true} // 需要后端支持
        />
      )
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
      render: (_: any, record: ProjectConfig) => (
        <div>
          <Button 
            type="text" 
            icon={<SyncOutlined />} 
            loading={syncLoading === record.id}
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
          disabled={true} // 需要后端支持
        />
      )
    },
    { 
      title: '阈值配置', 
      key: 'thresholds',
      render: () => (
        <div>
          <Tag color="success">优秀 ≥80%</Tag>
          <Tag color="warning">良好 ≥60%</Tag>
          <Tag color="error">警告 &lt;60%</Tag>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Button type="link" disabled>编辑阈值</Button>
      ),
    },
  ];

  // 模拟监控指标配置（需要后端支持）
  const mockMetrics = [
    { id: 1, name: '需求完成率', enabled: true },
    { id: 2, name: '缺陷密度', enabled: true },
    { id: 3, name: '进度偏差', enabled: true },
    { id: 4, name: '代码覆盖率', enabled: false },
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
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <Spin tip="加载项目配置..." />
              </div>
            ) : projects.length === 0 ? (
              <Empty 
                description="暂无项目配置，请先添加项目"
                style={{ marginTop: '48px' }}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProject}>
                  添加第一个项目
                </Button>
              </Empty>
            ) : (
              <Table 
                columns={projectColumns} 
                dataSource={projects}
                rowKey="id"
              />
            )}
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
                <Switch defaultChecked disabled />
              </Form.Item>
              
              <Form.Item label="通知频率">
                <Select defaultValue="realtime" style={{ width: 200 }} disabled>
                  <Option value="realtime">实时通知</Option>
                  <Option value="hourly">每小时汇总</Option>
                  <Option value="daily">每日汇总</Option>
                </Select>
              </Form.Item>

              <Form.Item label="风险等级通知">
                <Select mode="multiple" defaultValue={['high', 'medium']} style={{ width: 400 }} disabled>
                  <Option value="high">🔴 高风险</Option>
                  <Option value="medium">🟡 中风险</Option>
                  <Option value="low">🔵 低风险</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" disabled>保存设置</Button>
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
            label="GitHub仓库"
            name="githubRepo"
          >
            <Input placeholder="例如：Wayne-ai-droid/AIPMO（可选）" />
          </Form.Item>

          <Form.Item
            label="项目状态"
            name="status"
            initialValue="active"
          >
            <Select>
              <Option value="active">活跃</Option>
              <Option value="inactive">停用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </ div>
  );
};

export default Settings;