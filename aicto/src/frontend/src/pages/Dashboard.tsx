import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Statistic, Spin, Empty, Button } from 'antd';
import { ProjectOutlined, TeamOutlined, CalendarOutlined, ReloadOutlined } from '@ant-design/icons';
import { getYunxiaoProjects } from '../api/yunxiao';

interface Project {
  id: string;
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getYunxiaoProjects();
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

  const handleProjectClick = (projectId: string) => {
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
          <Tag color="blue" style={{ marginLeft: 12 }}>{projects.length} 个项目</Tag>
        </h1>
        <Button icon={<ReloadOutlined />} onClick={fetchProjects}>
          刷新
        </Button>
      </div>

      {projects.length === 0 ? (
        <Empty description="暂无项目数据" />
      ) : (
        <Row gutter={[24, 24]}>
          {projects.map((project) => {
            const health = getHealthStatus(project.healthScore);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                <Card
                  hoverable
                  onClick={() => handleProjectClick(project.id)}
                  style={{ height: '100%', cursor: 'pointer' }}
                  bodyStyle={{ padding: '20px' }}
                >
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{project.name}</h3>
                      <Tag color={health.color}>{health.text}</Tag>
                    </div>
                    <p style={{ 
                      marginTop: '8px', 
                      marginBottom: 0, 
                      color: '#666', 
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
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
                        value={project.iterationCount}
                        prefix={<CalendarOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="成员"
                        value={project.memberCount}
                        prefix={<TeamOutlined />}
                        valueStyle={{ fontSize: '16px' }}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="健康度"
                        value={project.healthScore}
                        suffix="分"
                        valueStyle={{ 
                          fontSize: '16px', 
                          color: getHealthColor(project.healthScore)
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
