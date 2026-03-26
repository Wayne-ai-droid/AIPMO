import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Badge, Spin, Button, message } from 'antd';
import { EyeOutlined, SyncOutlined, ReloadOutlined } from '@ant-design/icons';
import { getProjects, syncFromYunxiao } from '../api/dashboard';

const Projects: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      if (res.success) {
        setProjects(res.data || []);
      } else {
        message.error('获取项目列表失败');
      }
    } catch (err) {
      message.error('连接后端服务失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncFromYunxiao();
      if (res.success) {
        message.success('同步成功');
        await fetchProjects();
      } else {
        message.error('同步失败: ' + (res.message || '未知错误'));
      }
    } catch (err) {
      message.error('同步失败: ' + (err as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

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
      render: (text: string) => text ? (
        <code style={{ background: '#f5f5f5', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>
          {text.substring(0, 16)}...
        </code>
      ) : '-',
    },
    {
      title: '健康度',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score: number) => {
        const s = score ?? 100;
        let color: string = 'success';
        if (s < 60) color = 'error';
        else if (s < 80) color = 'warning';
        return <Badge color={color} text={`${s}分`} />;
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
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => text || '-',
      ellipsis: true,
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
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>
          项目管理
          <Tag color="blue" style={{ marginLeft: 12 }}>{projects.length} 个项目</Tag>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<ReloadOutlined />} onClick={fetchProjects} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<SyncOutlined />} onClick={handleSync} loading={syncing}>
            从云效同步
          </Button>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={projects}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
};

export default Projects;
