import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Progress, Badge, Spin } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, BugOutlined, WarningOutlined } from '@ant-design/icons';

// 模拟数据
const mockData = {
  stats: {
    totalProjects: 5,
    totalDemands: 128,
    pendingBugs: 23,
    riskProjects: 1
  },
  projects: [
    {
      id: 1,
      name: '电商中台重构',
      healthScore: 85,
      status: 'excellent',
      progress: 80,
      pendingBugs: 3,
      demands: { total: 45, done: 36, doing: 9 },
      bugs: { total: 12, closed: 9, new: 3 }
    },
    {
      id: 2,
      name: '支付系统升级',
      healthScore: 72,
      status: 'good',
      progress: 65,
      pendingBugs: 8,
      demands: { total: 32, done: 20, doing: 12 },
      bugs: { total: 18, closed: 10, new: 8 }
    },
    {
      id: 3,
      name: '用户中心V2',
      healthScore: 45,
      status: 'warning',
      progress: 40,
      pendingBugs: 12,
      demands: { total: 28, done: 11, doing: 17 },
      bugs: { total: 25, closed: 13, new: 12 }
    },
    {
      id: 4,
      name: '数据报表平台',
      healthScore: 90,
      status: 'excellent',
      progress: 95,
      pendingBugs: 0,
      demands: { total: 15, done: 14, doing: 1 },
      bugs: { total: 5, closed: 5, new: 0 }
    },
    {
      id: 5,
      name: '移动端App',
      healthScore: 78,
      status: 'good',
      progress: 70,
      pendingBugs: 5,
      demands: { total: 38, done: 26, doing: 12 },
      bugs: { total: 15, closed: 10, new: 5 }
    }
  ]
};

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(mockData);

  useEffect(() => {
    // 模拟API加载
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const getHealthColor = (score: number) => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    return '#f5222d';
  };

  const getHealthStatus = (status: string) => {
    switch (status) {
      case 'excellent': return { text: '优秀', color: 'success' };
      case 'good': return { text: '良好', color: 'processing' };
      case 'warning': return { text: '警告', color: 'warning' };
      case 'danger': return { text: '危险', color: 'error' };
      default: return { text: '未知', color: 'default' };
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>
        AICTO Dashboard 
        <Tag color="blue" style={{ marginLeft: 12 }}>模拟数据</Tag>
      </h1>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={data.stats.totalProjects}
              prefix={<ProjectOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总需求数"
              value={data.stats.totalDemands}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待修复缺陷"
              value={data.stats.pendingBugs}
              prefix={<BugOutlined />}
              valueStyle={{ color: data.stats.pendingBugs > 20 ? '#cf1322' : '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="风险项目"
              value={data.stats.riskProjects}
              prefix={<WarningOutlined />}
              valueStyle={{ color: data.stats.riskProjects ? '#cf1322' : '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目健康度列表 */}
      <Card title="项目健康度监控" loading={loading} extra={<a href="#">查看全部</a>}>
        <List
          dataSource={data.projects}
          renderItem={(project) => {
            const health = getHealthStatus(project.status);
            return (
              <List.Item
                actions={[
                  <a key="detail">查看详情</a>,
                  <a key="config">配置</a>
                ]}
              >
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{project.name}</span>
                      <Tag color={health.color}>{health.text}</Tag>
                      {project.status === 'warning' && (
                        <Badge status="error" text="需关注" />
                      )}
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <Progress
                          percent={project.healthScore}
                          strokeColor={getHealthColor(project.healthScore)}
                          size="small"
                          style={{ width: 200 }}
                        />
                        <span style={{ color: '#666' }}>
                          进度: {project.progress}% | 
                          需求: {project.demands.done}/{project.demands.total} | 
                          缺陷: {project.pendingBugs}个待修复
                        </span>
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      {/* 风险预警 */}
      {data.projects.some(p => p.status === 'warning' || p.status === 'danger') && (
        <Card 
          title="⚠️ 风险预警" 
          style={{ marginTop: 24 }}
          headStyle={{ backgroundColor: '#fff2f0', borderBottom: '1px solid #ffccc7' }}
        >
          <List
            dataSource={data.projects.filter(p => p.status === 'warning' || p.status === 'danger')}
            renderItem={(project) => (
              <List.Item>
                <div>
                  <Tag color="error">高风险</Tag>
                  <span style={{ marginLeft: 8, fontWeight: 500 }}>{project.name}</span>
                  <div style={{ marginTop: 8, color: '#666' }}>
                    {project.progress < 50 && '项目进度严重滞后，'}
                    {project.pendingBugs > 10 && '缺陷积压过多，'}
                    建议立即采取措施
                  </div>
                </div>
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
