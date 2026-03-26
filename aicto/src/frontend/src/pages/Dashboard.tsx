import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Statistic, Spin, Empty, Button, message } from 'antd';
import { ProjectOutlined, TeamOutlined, CalendarOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { getProjects, syncFromYunxiao } from '../api/dashboard';

interface Project {
  id: string | number;
  name: string;
  description: string;
  status: string;
  iterationCount: number;
  memberCount: number;
  healthScore: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 从数据库读取项目列表
  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getProjects();
      if (response.success) {
        setProjects(response.data || []);
      } else {
        setError('获取项目列表失败');
      }
    } catch (err) {
      setError('获取项目列表失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 从云效同步数据后刷新
  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await syncFromYunxiao();
      if (res.success) {
        message.success('同步成功，正在刷新数据...');
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

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { text: '优秀', color: 'success' };
    if (score >= 60) return { text: '良好', color: 'processing' };
    return { text: '需关注', color: 'warning' };
  };

  const handleProjectClick = (projectId: string | number) => {
    navigate(`/projects/${projectId}`);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载项目中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty description={error}>
          <Button type="primary" onClick={fetchProjects} icon={<ReloadOutlined />}>
            重新加载
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>
          <ProjectOutlined style={{ marginRight: 12 }} />
          项目列表
          <Tag color="blue" style={{ marginLeft: 12, fontSize: '14px' }}>
            {projects.length} 个项目
          </Tag>
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchProjects}
            loading={loading}
          >
            刷新
          </Button>
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={handleSync}
            loading={syncing}
          >
            从云效同步
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Empty
          description="暂无项目数据，点击「从云效同步」获取最新数据"
          style={{ marginTop: 80 }}
        >
          <Button type="primary" icon={<SyncOutlined />} onClick={handleSync} loading={syncing}>
            从云效同步
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => {
            const healthStatus = getHealthStatus(project.healthScore || 0);
            return (
              <Col key={project.id} xs={24} sm={12} lg={8} xl={6}>
                <Card
                  hoverable
                  onClick={() => handleProjectClick(project.id)}
                  style={{ height: '100%', cursor: 'pointer' }}
                  styles={{ body: { height: '100%' } }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, flex: 1, marginRight: 8 }}>{project.name}</h3>
                    <Tag color={healthStatus.color}>{healthStatus.text}</Tag>
                  </div>

                  <div style={{ minHeight: 40 }}>
                    <p style={{
                      color: '#666',
                      margin: 0,
                      fontSize: '13px',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {project.description || '暂无描述'}
                    </p>
                  </div>

                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={8}>
                      <Statistic
                        title="迭代"
                        value={project.iterationCount || 0}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="成员"
                        value={project.memberCount || 0}
                        prefix={<TeamOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="健康度"
                        value={project.healthScore || 0}
                        suffix="分"
                        valueStyle={{
                          fontSize: '16px',
                          color: getHealthColor(project.healthScore || 0)
                        }}
                      />
                    </Col>
                  </Row>

                  <div style={{ marginTop: '16px', textAlign: 'right' }}>
                    <Tag color="blue">点击查看详情 →</Tag>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );
};

export default Dashboard;
