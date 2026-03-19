import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu, Tag } from 'antd';
import {
  DashboardOutlined,
  ProjectOutlined,
  SettingOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Settings from './pages/Settings';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider trigger={null} collapsible theme="light">
          <div style={{ 
            height: 64, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 20,
            fontWeight: 'bold',
            color: '#1890ff'
          }}>
            AICTO
          </div>
          <Menu mode="inline" defaultSelectedKeys={['dashboard']}>
            <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
              <Link to="/">Dashboard</Link>
            </Menu.Item>
            <Menu.Item key="projects" icon={<ProjectOutlined />}>
              <Link to="/projects">项目管理</Link>
            </Menu.Item>
            <Menu.Item key="analytics" icon={<BarChartOutlined />}>
              <Link to="/analytics">数据分析</Link>
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
              <Link to="/settings">配置中心</Link>
            </Menu.Item>
          </Menu>
        </Sider>
        
        <Layout>
          <Header style={{ 
            background: '#fff', 
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,0.08)'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18 }}>AICTO Dashboard - 智能技术管理系统</h2>
            </div>
            <div>
              <Tag color="blue">演示版本</Tag>
            </div>
          </Header>
          
          <Content style={{ margin: '24px', background: '#fff', borderRadius: 8 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/analytics" element={<div style={{ padding: 24 }}><h2>数据分析</h2><p>功能开发中...</p></div>} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;
