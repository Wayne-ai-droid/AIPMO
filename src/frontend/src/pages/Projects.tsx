import React from 'react';
import { Table, Tag, Badge } from 'antd';

const mockProjects = [
  {
    id: 1,
    name: '电商中台重构',
    healthScore: 85,
    status: 'active',
    demands: 45,
    bugs: 12,
    manager: '张三',
    lastUpdate: '2026-03-19 10:30'
  },
  {
    id: 2,
    name: '支付系统升级',
    healthScore: 72,
    status: 'active',
    demands: 32,
    bugs: 18,
    manager: '李四',
    lastUpdate: '2026-03-19 09:15'
  },
  {
    id: 3,
    name: '用户中心V2',
    healthScore: 45,
    status: 'warning',
    demands: 28,
    bugs: 25,
    manager: '王五',
    lastUpdate: '2026-03-18 18:00'
  },
];

const Projects: React.FC = () => {
  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '健康度',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score: number) => {
        let color = 'success';
        if (score < 60) color = 'error';
        else if (score < 80) color = 'warning';
        return <Badge color={color} text={`${score}分`} />;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          'active': { color: 'success', text: '进行中' },
          'warning': { color: 'warning', text: '风险' },
          'completed': { color: 'default', text: '已完成' },
        };
        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '需求数',
      dataIndex: 'demands',
      key: 'demands',
    },
    {
      title: '缺陷数',
      dataIndex: 'bugs',
      key: 'bugs',
    },
    {
      title: '负责人',
      dataIndex: 'manager',
      key: 'manager',
    },
    {
      title: '最后更新',
      dataIndex: 'lastUpdate',
      key: 'lastUpdate',
    },
    {
      title: '操作',
      key: 'action',
      render: () => <a href="/projects/1">查看</a>,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1>项目管理</h1>
      <Table 
        columns={columns}
        dataSource={mockProjects}
        rowKey="id"
      />
    </div>
  );
};

export default Projects;
