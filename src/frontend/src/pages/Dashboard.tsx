import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Tag, Statistic, Spin, Empty, Button, Alert } from 'antd';
import { 
  ProjectOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  ReloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { getDashboardOverview } from '../api/dashboard';

interface Project {
  id: number;
  name: string;
  healthScore: number;
  status: 'excellent' | 'good' | 'warning' | 'danger';
  progress: number;
  pendingBugs: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<{
    stats: {
      totalProjects: number;
      totalDemands: number;
      pendingBugs: number;
      riskProjects: number;
    };
    projects: Project[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getDashboardOverview();
      if (response.success) {
        setOverviewData(response.data);
      } else {
        setError('获取Dashboard数据失败');
      }
    } catch (err) {
      setError('获取Dashboard数据失败: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#52c41a';
      case 'good': return '#95de64';
      case 'warning': return '#faad14';
      case 'danger': return '#f5222d';
      default: return '#8c8c8c';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'excellent': return '优秀';
      case 'good': return '良好';
      case 'warning': return '需关注';
      case 'danger': return '高风险';
      default: return '未知';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'good': return <CheckCircleOutlined style={{ color: '#95de64' }} />;
      case 'warning': return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'danger': return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      default: return <ClockCircleOutlined />;
    }
  };

  const handleProjectClick = (projectId: number) => {
    navigate(`/projects/${projectId}`);
  };

  const renderStatsCards = () => {
    if (!overviewData) return null;
    
    const { stats } = overviewData;
    
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="活跃项目"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="总需求数"
              value={stats.totalDemands}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="待修复缺陷"
              value={stats.pendingBugs}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card size="small">
            <Statistic
              title="风险项目"
              value={stats.riskProjects}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>
    );
  };

  const renderRiskAlerts = () => {
    if (!overviewData || overviewData.stats.riskProjects === 0) return null;
    
    const riskProjects = overviewData.projects.filter(p => p.status === 'danger' || p.status === 'warning');
    
    if (riskProjects.length === 0) return null;
    
    return (
      <Alert
        message="风险预警"
        description={
          <div>
            {riskProjects.map(project => (
              <div key={project.id} style={{ marginBottom: '8px' }}>
                {project.status === 'danger' ? '🔴' : '🟡'} {' '}
                {project.name} - 健康度{project.healthScore}% - {' '}
                {project.status === 'danger' ? '高风险' : '需关注'}
              </div>
            ))}
          </div>
        }
        type={riskProjects.some(p => p.status === 'danger') ? "error" : "warning"}
        showIcon
        style={{ marginBottom: '24px' }}
      />
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" tip="加载Dashboard数据中..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty description={error}>
          <Button type="primary" onClick={fetchDashboardOverview} icon={<ReloadOutlined />}>
            重新加载
          </Button>
        </Empty>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Empty description="暂无Dashboard数据">
          <Button type="primary" onClick={fetchDashboardOverview} icon={<ReloadOutlined />}>
            刷新数据
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
          AICTO Dashboard
          <Tag color="blue" style={{ marginLeft: 12 }}>{overviewData.stats.totalProjects} 个项目</Tag>
        </h1>
        <Button icon={<ReloadOutlined />} onClick={fetchDashboardOverview}>
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      {renderStatsCards()}

      {/* 风险预警 */}
      {renderRiskAlerts()}

      {/* 项目列表 */}
      {overviewData.projects.length === 0 ? (
        <Empty 
          description="暂无项目数据，请先在配置中心绑定云效项目" 
          style={{ marginTop: '48px' }}
        >
          <Button 
            type="primary" 
            onClick={() => navigate('/settings')}
          >
            前往配置中心
          </Button>
        </Empty>
      ) : (
        <div>
          <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>
            项目健康度矩阵
          </h2>
          <Row gutter={[24, 24]}>
            {overviewData.projects.map((project) => {
              const healthColor = getHealthColor(project.status);
              const healthText = getHealthStatusText(project.status);
              const healthIcon = getStatusIcon(project.status);
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                  <Card
                    hoverable
                    onClick={() => handleProjectClick(project.id)}
                    style={{ height: '100%', cursor: 'pointer', borderLeft: `4px solid ${healthColor}` }}
                    bodyStyle={{ padding: '20px' }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>{project.name}</h3>
                        <Tag icon={healthIcon} color={project.status === 'excellent' ? 'success' : project.status === 'good' ? 'processing' : project.status === 'warning' ? 'warning' : 'error'}>
                          {healthText}
                        </Tag>
                      </div>
                    </div>

                    <Row gutter={16} style={{ marginTop: '16px' }}>
                      <Col span={8}>
                        <Statistic
                          title="健康度"
                          value={project.healthScore}
                          suffix="%"
                          valueStyle={{ 
                            fontSize: '16px', 
                            color: healthColor,
                            fontWeight: 600
                          }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="进度"
                          value={project.progress}
                          suffix="%"
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="缺陷"
                          value={project.pendingBugs}
                          valueStyle={{ fontSize: '16px' }}
                        />
                      </Col>
                    </Row>

                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <Tag color="blue">查看详情 →</Tag>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      )}
    </div>
  );
};

export default Dashboard;