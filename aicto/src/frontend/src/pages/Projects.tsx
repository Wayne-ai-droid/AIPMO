import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Badge, Spin, message, Button } from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const API_BASE_URL = 'http://localhost:3001/api';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<any>(null);

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

  // 从冲刺数据生成项目列表
  const projects = syncData?.sprints ? [
    {
      id: 1,
      name: 'MFP项目',
      yunxiaoProjectId: syncData.projectId,
      healthScore: 85,
      status: 'active',
      sprints: syncData.sprints.length,
      members: syncData.members.length,
      manager: '林博',
      lastUpdate: new Date().toLocaleString()
    }
  ] : [];

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate(`/projects/${record.id}`);
          }}
          style={{ fontWeight: 500, fontSize: 14 }}
        >
          {text}
        </a>
      ),
    },
    {
      title: '云效项目ID',
      dataIndex: 'yunxiaoProjectId',
      key: 'yunxiaoProjectId',
      render: (text: string) => (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
          {text?.substring(0, 16)}...
        </code>
      ),
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
      title: '冲刺数',
      dataIndex: 'sprints',
      key: 'sprints',
    },
    {
      title: '成员数',
      dataIndex: 'members',
      key: 'members',
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
      render: (_: any, record: any) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/projects/${record.id}`)}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 24 }}>
        项目管理
        <Tag color="green" style={{ marginLeft: 12 }}>真实数据</Tag>
      </h1>
      <Table 
        columns={columns}
        dataSource={projects}
        loading={loading}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
};

export default Projects;
