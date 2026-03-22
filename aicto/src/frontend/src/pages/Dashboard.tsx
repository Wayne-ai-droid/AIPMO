import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Statistic, List, Tag, Select, Spin, message, Button } from 'antd';
import { ProjectOutlined, CheckCircleOutlined, BugOutlined, WarningOutlined, EyeOutlined } from '@ant-design/icons';

const { Option } = Select;
const API_BASE_URL = 'http://localhost:3001/api';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [syncData, setSyncData] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData(selectedProject);
  }, [selectedProject]);

  const fetchProjectData = (projectId: string) => {
    setLoading(true);
    fetch(`${API_BASE_URL}/sync/project/${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSyncData(data.data);
          setLoading(false);
        } else {
          setError(data.error || '获取数据失败');
          setLoading(false);
        }
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        message.error('连接后端服务失败');
      });
  };

  // 计算统计数据
  const stats = syncData ? {
    totalSprints: syncData.sprints?.length || 0,
    totalMembers: syncData.members?.length || 0,
    activeSprints: syncData.sprints?.filter((s: any) => s.status === 'DOING').length || 0,
    todoSprints: syncData.sprints?.filter((s: any) => s.status === 'TODO').length || 0,
  } : {
    totalSprints: 0,
    totalMembers: 0,
    activeSprints: 0,
    todoSprints: 0,
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'TODO': { text: '待开始', color: 'default' },
      'DOING': { text: '进行中', color: 'processing' },
      'DONE': { text: '已完成', color: 'success' },
      'ARCHIVED': { text: '已归档', color: 'default' },
    };
    return statusMap[status] || { text: status, color: 'default' };
  };

  // 项目选项（目前只有MFP项目）
  const projectOptions = [
    { value: 'default', label: 'MFP项目' },
  ];

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <h1>AICTO Dashboard</h1>
        <Card>
          <p style={{ color: 'red' }}>错误: {error}</p>
          <p>请确保后端服务已启动: http://localhost:3001</p>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>
          AICTO Dashboard
          <Tag color="green" style={{ marginLeft: 12 }}>真实数据</Tag>
        </h1>
        
        <div>
          <span style={{ marginRight: 8 }}>选择项目:</span>
          <Select
            value={selectedProject}
            onChange={setSelectedProject}
            style={{ width: 200 }}
            loading={loading}
          >
            {projectOptions.map(opt => (
              <Option key={opt.value} value={opt.value}>{opt.label}</Option>
            ))}
          </Select>
        </div>
      </div>
      
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总冲刺数"
              value={stats.totalSprints}
              prefix={<ProjectOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="项目成员"
              value={stats.totalMembers}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中冲刺"
              value={stats.activeSprints}
              prefix={<BugOutlined />}
              valueStyle={{ color: stats.activeSprints > 0 ? '#52c41a' : '#999' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待开始冲刺"
              value={stats.todoSprints}
              prefix={<WarningOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* 冲刺列表 */}
      <Card 
        title="冲刺列表" 
        loading={loading}
        extra={
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={() => navigate('/projects/1')}
          >
            查看项目详情
          </Button>
        }
      >
        <List
          itemLayout="horizontal"
          dataSource={syncData?.sprints || []}
          renderItem={(sprint: any) => {
            const status = getStatusTag(sprint.status);
            return (
              <List.Item>
                <List.Item.Meta
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span>{sprint.name}</span>
                      <Tag color={status.color}>{status.text}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <p>负责人: {sprint.owners?.[0]?.name || sprint.creator?.name || 'N/A'}</p>
                      <p>时间: {new Date(sprint.startDate).toLocaleDateString()} ~ {new Date(sprint.endDate).toLocaleDateString()}</p>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>

      {/* 成员列表 */}
      <Card title="项目成员" loading={loading} style={{ marginTop: 24 }}>
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={syncData?.members?.slice(0, 12) || []}
          renderItem={(member: any) => (
            <List.Item>
              <Card size="small">
                <div style={{ textAlign: 'center' }}>
                  <img 
                    src={member.userAvatar || 'https://via.placeholder.com/50'} 
                    alt={member.userName}
                    style={{ width: 50, height: 50, borderRadius: '50%', marginBottom: 8 }}
                  />
                  <div style={{ fontWeight: 500 }}>{member.userName}</div>
                  <Tag size="small" style={{ marginTop: 4 }}>{member.roleName}</Tag>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Dashboard;
