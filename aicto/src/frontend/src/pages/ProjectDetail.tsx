import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tag, List, Button, Spin, message, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, ProjectOutlined, TeamOutlined, CalendarOutlined } from '@ant-design/icons';

const API_BASE_URL = 'http://localhost:3001/api';

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<any>(null);

  useEffect(() => {
    // 调用后端API获取真实数据
    fetch(`${API_BASE_URL}/sync/project/${id || 'default'}`)
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
  }, [id]);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'TODO': { text: '待开始', color: 'default' },
      'DOING': { text: '进行中', color: 'processing' },
      'DONE': { text: '已完成', color: 'success' },
      'ARCHIVED': { text: '已归档', color: 'default' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  const sprintColumns = [
    {
      title: '冲刺名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const s = getStatusTag(status);
        return <Tag color={s.color}>{s.text}</Tag>;
      }
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: number) => new Date(date).toLocaleDateString(),
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: number) => new Date(date).toLocaleDateString(),
    },
    {
      title: '负责人',
      dataIndex: 'owners',
      key: 'owners',
      render: (owners: any[]) => owners?.[0]?.name || 'N/A',
    },
  ];

  const stats = syncData ? {
    totalSprints: syncData.sprints?.length || 0,
    totalMembers: syncData.members?.length || 0,
    activeSprints: syncData.sprints?.filter((s: any) => s.status === 'DOING').length || 0,
    completedSprints: syncData.sprints?.filter((s: any) => s.status === 'DONE' || s.status === 'ARCHIVED').length || 0,
  } : { totalSprints: 0, totalMembers: 0, activeSprints: 0, completedSprints: 0 };

  return (
    <div style={{ padding: 24 }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/projects')}
        style={{ marginBottom: 16 }}
      >
        返回项目列表
      </Button>

      <h1 style={{ marginBottom: 24 }}>
        <ProjectOutlined style={{ marginRight: 8 }} />
        MFP项目详情
        <Tag color="green" style={{ marginLeft: 12 }}>真实数据</Tag>
      </h1>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总冲刺数"
              value={stats.totalSprints}
              prefix={<CalendarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="项目成员"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.activeSprints}
              valueStyle={{ color: '#1890ff' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completedSprints}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 冲刺列表 */}
      <Card title="冲刺列表" loading={loading} style={{ marginBottom: 24 }}>
        <Table
          columns={sprintColumns}
          dataSource={syncData?.sprints || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* 成员列表 */}
      <Card title="项目成员" loading={loading}>
        <List
          grid={{ gutter: 16, column: 6 }}
          dataSource={syncData?.members || []}
          renderItem={(member: any) => (
            <List.Item>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={member.userAvatar || 'https://via.placeholder.com/40'}
                    alt={member.userName}
                    style={{ width: 40, height: 40, borderRadius: '50%', marginBottom: 8 }}
                  />
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{member.userName}</div>
                  <Tag size="small" style={{ marginTop: 4, fontSize: 10 }}>{member.roleName}</Tag>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default ProjectDetail;
