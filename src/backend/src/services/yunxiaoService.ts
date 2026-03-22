import axios from 'axios';
import { logger } from '../utils/logger';

const YUNXIAO_BASE_URL = 'https://openapi-rdc.aliyuncs.com/oapi/v1/projex';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || '';
const ORG_ID = '6925baaef9c52e7d8c27b51b';

// 创建axios实例
const yunxiaoClient = axios.create({
  baseURL: YUNXIAO_BASE_URL,
  headers: {
    'x-yunxiao-token': YUNXIAO_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// TODO: 当前使用Mock数据，因为Token无法访问项目列表API
// 需要去阿里云重新生成Token或获取正确的API路径

/**
 * 获取项目列表
 * 当前使用Mock数据，后续需要替换为真实API调用
 */
export async function getProjects() {
  try {
    // 尝试调用真实API
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects`);
    
    if (response.result) {
      return response.result;
    } else if (response.data) {
      return response.data;
    }
    
    // 如果API返回空或失败，使用Mock数据
    logger.warn('Yunxiao API returned empty, using mock data');
    return getMockProjects();
  } catch (error) {
    logger.error('Failed to get projects from Yunxiao, using mock data:', error);
    return getMockProjects();
  }
}

/**
 * Mock项目数据
 */
function getMockProjects() {
  return [
    {
      id: 'e55139fd2a036662c391e0181b',
      name: 'MFP项目',
      description: 'Merchant Financing Platform - 商家融资平台',
      status: 'active',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2026-03-22T00:00:00Z',
      iterationCount: 15,
      memberCount: 13,
      healthScore: 85,
    },
    {
      id: 'proj-002',
      name: 'Dowalet钱包',
      description: 'Dowsure钱包系统',
      status: 'active',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2026-03-20T00:00:00Z',
      iterationCount: 8,
      memberCount: 6,
      healthScore: 90,
    },
    {
      id: 'proj-003',
      name: 'MoF项目',
      description: 'Merchant on File - 商家档案系统',
      status: 'active',
      createdAt: '2024-03-10T00:00:00Z',
      updatedAt: '2026-03-18T00:00:00Z',
      iterationCount: 12,
      memberCount: 8,
      healthScore: 78,
    },
  ];
}

/**
 * 获取项目详情
 */
export async function getProjectDetail(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}`);
    return response.result || response.data || response;
  } catch (error) {
    logger.error(`Failed to get project ${projectId}:`, error);
    // 返回Mock数据
    const mockProjects = getMockProjects();
    return mockProjects.find((p: any) => p.id === projectId) || mockProjects[0];
  }
}

/**
 * 获取项目迭代列表
 */
export async function getIterations(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}/sprints`);
    return response.result || response.data || [];
  } catch (error) {
    logger.warn(`Failed to get iterations for project ${projectId}:`, error);
    // 返回Mock迭代数据
    return [
      { id: 'sprint-001', name: 'Sprint 1', status: 'CLOSED' },
      { id: 'sprint-002', name: 'Sprint 2', status: 'CLOSED' },
      { id: 'sprint-003', name: 'Sprint 3', status: 'DOING' },
    ];
  }
}

/**
 * 获取项目成员列表
 */
export async function getProjectMembers(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}/members`);
    return response.result || response.data || [];
  } catch (error) {
    logger.warn(`Failed to get members for project ${projectId}:`, error);
    return [];
  }
}
