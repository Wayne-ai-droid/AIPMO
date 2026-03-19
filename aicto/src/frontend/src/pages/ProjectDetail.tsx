import React, { useState } from 'react';
import { Card, Tabs, Table, Tag, Progress, Statistic, Row, Col, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';

// 模拟项目详情数据
const mockProjectDetail = {
  id: 1,
  name: '电商中台重构',
  healthScore: 85,
  status: 'excellent',
  description: '电商平台核心系统重构项目，包括订单、库存、支付等模块',
  manager: '张三',
  startDate: '2026-01-15',
  endDate: '2026-04-30',
  progress: 80,
  stats: {
    demands: { total: 45, done: 36, doing: 9, todo: 0 },
    bugs: { total: 12, closed: 9, new: 2, fixing: 1 },
    members: 8
  }
};

// 模拟需求数据
const mockDemands = [
  { id: 1001, title: '订单管理模块重构', status: 'done', priority: 'P0', assignee: '张三', progress: 100 },
  { id: 1002, title: '库存系统优化', status: 'done', priority: 'P0', assignee: '李四', progress: 100 },
  { id: 1003, title: '支付接口升级', status: 'doing', priority: 'P0', assignee: '王五', progress: 75 },
  { id: 1004, title: '用户中心改造', status: 'doing', priority: 'P1', assignee: '赵六', progress: 60 },
  { id: 1005, title: '数据统计报表', status: 'doing', priority: 'P1', assignee: '钱七', progress: 40 },
  { id: 1006, title: '消息通知系统', status: 'todo', priority: 'P2', assignee: '孙八', progress: 0 },
];

// 模拟缺陷数据
const mockBugs = [
  { id: 2001, title: '订单提交后页面卡顿', severity: 'serious', status: 'fixing', assignee: '张三', createdAt: '2026-03-15' },
  { id: 2002, title: '库存数量显示不正确', severity: 'normal', status: 'new', assignee: '李四', createdAt: '2026-03-18' },
  { id: 2003, title: '支付回调偶尔失败', severity: 'fatal', status: 'closed', assignee: '王五', createdAt: '2026-03-10' },
];

const ProjectDetail: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      'done': { color: 'success', text: '已完成' },
      'doing': { color: 'processing', text: '进行中' },
      'todo': { color: 'default', text: '待处理' },
      'closed': { color: 'success', text: '已关闭' },
      'new': { color: 'error', text: '新建' },
      'fixing': { color: 'warning', text: '修复中' },
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

  const items = [
    {
      key: 'overview',
      label: '项目概览',
      children: (
        <div>
          <Card title="基本信息" style={{ marginBottom: 24 }}>
            <Row gutter={24}>
              <Col span={16}>
                <p><strong>项目名称：</strong>{mockProjectDetail.name}</p>
                <p><strong>项目描述：</strong>{mockProjectDetail.description}</p>
                <p><strong>项目经理：</strong>{mockProjectDetail.manager}</p>
                <p><strong>项目周期：</strong>{mockProjectDetail.startDate} ~ {mockProjectDetail.endDate}</p>
              </Col>
              <Col span={8}>
                <div style={{ textAlign: 'center' }}>
                  <Progress 
                    type="circle" 
                    percent={mockProjectDetail.healthScore}
                    strokeColor={mockProjectDetail.healthScore >= 80 ? '#52c41a' : mockProjectDetail.healthScore >= 60 ? '#faad14' : '#f5222d'}
                    size={120}
                  />
                  <p style={{ marginTop: 12 }}>健康度评分</p>
                </div>
              </Col>
            </Row>
          </Card>

          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic 
                  title="总需求" 
                  value={mockProjectDetail.stats.demands.total}
                  suffix={`/ 已完成 ${mockProjectDetail.stats.demands.done}`}
                />
                <Progress 
                  percent={Math.round((mockProjectDetail.stats.demands.done / mockProjectDetail.stats.demands.total) * 100)}
                  status="active"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic 
                  title="缺陷统计" 
                  value={mockProjectDetail.stats.bugs.total}
                  suffix={`/ 已修复 ${mockProjectDetail.stats.bugs.closed}`}
                />
                <Progress 
                  percent={Math.round((mockProjectDetail.stats.bugs.closed / mockProjectDetail.stats.bugs.total) * 100)}
                  status="active"
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="团队成员" value={mockProjectDetail.stats.members} suffix="人" />
              </Card>
            </Col>
          </Row>
        </div>
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
          {mockBugs.some(b => b.severity === 'fatal' || b.severity === 'serious') && (
            <Card style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
              <Badge status="error" text="高风险缺陷" />
              <p style={{ marginTop: 8, color: '#ff4d4f' }}>
                存在 {mockBugs.filter(b => b.severity === 'fatal').length} 个致命缺陷，
                {mockBugs.filter(b => b.severity === 'serious').length} 个严重缺陷需要优先处理
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
    {
      key: 'settings',
      label: '项目配置',
      children: (
        <Card title="项目配置">
          <p>配置功能开发中...</p>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>{mockProjectDetail.name}</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>{mockProjectDetail.description}</p>
      
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default ProjectDetail;
