import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Tabs, Table, Tag, Progress, Statistic, Row, Col, Badge, Spin, Button, Empty } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getYunxiaoProject } from '../api/yunxiao';

interface ProjectDetail {
  id: string;
  name: string;
  description: string;
  status: string;
  healthScore: number;
  iterations: any[];
  memberCount?: number;
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProjectDetail = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await getYunxiaoProject(id);
      if (response.success) {
        setProject(response.data);
      } else {
        setError('获取项目详情失败');
      }
    } catch (err) {
      setError('获取项目详情失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectDetail();
  }, [id]);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'done': { color: 'success', text: '已完成' },
      'doing': { color: 'processing', text: '进行中' },
      'todo': { color: 'default', text: '待处理' },
      'closed': { color: 'success', text: '已关闭' },
      'new': { color: 'error', text: '新建' },
      'fixing': { color: 'warning', text: '修复中' },
      'active': { color: 'success', text: '活跃' },
      'inactive': { color: 'default', text: '停用' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getPriorityTag = (priority: string) => {
    const colorMap: Record<string, string> = {
      'P0': 'red',
      'P1': 'orange',
      'P2': 'blue',
      'P3': 'green',
    };
    return <Tag color={colorMap[priority] || 'default'}>{priority}</Tag>;
  };

  const getSeverityTag = (severity: string) => {
    const severityMap: Record<string, { color: string; text: string }> = {
      'fatal': { color: 'red', text: '致命' },
      'serious': { color: 'orange', text: '严重' },
      'normal': { color: 'blue', text: '一般' },
      'tip': { color: 'green', text: '提示' },
    };
    const config = severityMap[severity] || { color: 'default', text: severity };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 模拟需求和缺陷数据（后续可以接入真实API）
  const mockDemands = [
    { id: 1001, title: '订单管理模块重构', status: 'done', priority: 'P0', assignee: '张三', progress: 100 },
    { id: 1002, title: '库存系统优化', status: 'done', priority: 'P0', assignee: '李四', progress: 100 },
    { id: 1003, title: '支付接口升级', status: 'doing', priority: 'P0', assignee: '王五', progress: 75 },
    { id: 1004, title: '用户中心改造', status: 'doing', priority: 'P1', assignee: '赵六', progress: 60 },
  ];

  const mockBugs = [
    { id: 2001, title: '订单提交后页面卡顿', severity: 'serious', status: 'fixing', assignee: '张三', createdAt: '2026-03-15' },
    { id: 2002, title: '库存数量显示不正确', severity: 'normal', status: 'new', assignee: '李四', createdAt: '2026-03-18' },
  ];

  const demandColumns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: (status) => getStatusTag(status)
    },
    { 
      title: '优先级', 
      dataIndex: 'priority', 
      width: 80,
      render: (priority) => getPriorityTag(priority)
    },
    { title: '负责人', dataIndex: 'assignee', width: 100 },
    { 
      title: '进度', 
      dataIndex: 'progress', 
      width: 120,
      render: (progress) => <Progress percent={progress} size="small" />
    },
  ];

  const bugColumns: ColumnsType<any> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { 
      title: '严重程度', 
      dataIndex: 'severity', 
      width: 100,
      render: (severity) => getSeverityTag(severity)
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: (status) => getStatusTag(status)
    },
    { title: '负责人', dataIndex: 'assignee', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 120 },
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载项目详情..." />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty description={error || '项目不存在'}>
          <Button type="primary" onClick={fetchProjectDetail} icon={<ReloadOutlined />}>
            重新加载
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => navigate('/')}>
            返回项目列表
          </Button>
        </Empty>
      </div>
    );
  }

  const items = [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <div>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <p><strong>项目名称：</strong>{project.name}</p>
                <p><strong>项目描述：</strong>{project.description || '暂无描述'}</p>
                <p><strong>项目状态：</strong>{getStatusTag(project.status)}</p>
                <p><strong>迭代数量：</strong>{project.iterations?.length || 0} 个</p>
                <p><strong>成员数量：</strong>{project.memberCount || 0} 人</p>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress 
                    type="circle" 
                    percent={project.healthScore || 80}
                    strokeColor={project.healthScore >= 80 ? '#52c41a' : project.healthScore >= 60 ? '#faad14' : '#f5222d'}
                    size={120}
                  />
                  <p style={{ marginTop: 12 }}>健康度评分</p>
                </div>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={12}>
              <Card>
                <Statistic 
                  title="活跃迭代" 
                  value={project.iterations?.filter((i: any) => i.status === 'active').length || 0}
                  suffix={`/ 总迭代 ${project.iterations?.length || 0}`}
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card>
                <Statistic 
                  title="团队成员" 
                  value={project.memberCount || 0} 
                  suffix="人" 
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'iterations',
      label: '迭代列表',
      children: (
        <Table 
          columns={[
            { title: '迭代名称', dataIndex: 'name', key: 'name' },
            { title: '状态', dataIndex: 'status', key: 'status', render: (status) => getStatusTag(status) },
            { title: '开始时间', dataIndex: 'startDate', key: 'startDate' },
            { title: '结束时间', dataIndex: 'endDate', key: 'endDate' },
          ]}
          dataSource={project.iterations || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'demands',
      label: '需求列表',
      children: (
        <Table 
          columns={demandColumns} 
          dataSource={mockDemands}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      ),
    },
    {
      key: 'bugs',
      label: '缺陷列表',
      children: (
        <div>
          {mockBugs.some((b: any) => b.severity === 'fatal' || b.severity === 'serious') && (
            <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
              <Badge status="error" text="高风险缺陷" />
              <p style={{ marginTop: 8, color: '#ff4d4f' }}>
                存在 {mockBugs.filter((b: any) => b.severity === 'fatal').length} 个致命缺陷，
                {mockBugs.filter((b: any) => b.severity === 'serious').length} 个严重缺陷需要优先处理
              </p>
            </Card>
          )}
          <Table 
            columns={bugColumns} 
            dataSource={mockBugs}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/')}
          style={{ marginRight: 16 }}
        >
          返回项目列表
        </Button>
        <span style={{ fontSize: 20, fontWeight: 'bold' }}>{project.name}</span>
        <Tag color="blue" style={{ marginLeft: 12 }}>
          {project.status === 'active' ? '活跃' : project.status}
        </Tag>
      </div>
      
      <p style={{ color: '#666', marginBottom: 24 }}>{project.description || '暂无描述'}</p>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default ProjectDetailPage;
