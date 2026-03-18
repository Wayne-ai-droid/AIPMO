import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, List, Tag, Progress, Badge } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, BugOutlined, WarningOutlined } from '@ant-design/icons';
import { getDashboardOverview } from '../api/dashboard';
import type { DashboardOverview } from '../types';

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const result = await getDashboardOverview();
      setData(result.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      <h1>AICTO Dashboard</h1>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={data?.stats.totalProjects || 0}
              prefix={<ProjectOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总需求数"
              value={data?.stats.totalDemands || 0}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待修复缺陷"
              value={data?.stats.pendingBugs || 0}
              prefix={<BugOutlined />}
              loading={loading}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="风险项目"
              value={data?.stats.riskProjects || 0}
              prefix={<WarningOutlined />}
              loading={loading}
              valueStyle={{ color: data?.stats.riskProjects ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 项目健康度列表 */}
      <Card title="项目健康度" loading={loading}>
        <List
          dataSource={data?.projects || []}
          renderItem={(project) => {
            const health = getHealthStatus(project.status);
            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span>{project.name}</span>
                      <Tag color={health.color}>{health.text}</Tag>
                    </div>
                  }
                  description={
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={project.healthScore}
                        strokeColor={getHealthColor(project.healthScore)}
                        size="small"
                        style={{ width: 200 }}
                      />
                      <span style={{ marginLeft: 16, color: '#666' }}>
                        进度: {project.progress}% | 待修复: {project.pendingBugs}个
                      </span>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
