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

/**
 * 获取项目列表
 * API: POST /oapi/v1/projex/organizations/{organizationId}/projects:search
 */
export async function getProjects() {
  try {
    logger.info('Fetching projects from Yunxiao API...');
    logger.info(`Using token: ${YUNXIAO_TOKEN.substring(0, 10)}...`);
    
    const response: any = await yunxiaoClient.post(
      `/organizations/${ORG_ID}/projects:search`,
      {
        page: 1,
        perPage: 50,
      }
    );
    
    logger.info('Yunxiao API response received');
    
    // API返回的是数组
    if (Array.isArray(response)) {
      logger.info(`Found ${response.length} projects`);
      return response.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.logicalStatus || 'active',
        createdAt: project.gmtCreate,
        updatedAt: project.gmtModified,
        iterationCount: 0, // 需要从其他API获取
        memberCount: 0,    // 需要从其他API获取
        healthScore: 80,
      }));
    }
    
    logger.warn('Unexpected response format:', response);
    return [];
  } catch (error: any) {
    logger.error('Failed to get projects from Yunxiao:', error.message);
    logger.error('Error details:', error.response?.data || error);
    return [];
  }
}

/**
 * 获取项目详情
 */
export async function getProjectDetail(projectId: string) {
  try {
    const projects = await getProjects();
    const project = projects.find((p: any) => p.id === projectId);
    
    if (project) {
      return project;
    }
    
    throw new Error(`Project ${projectId} not found`);
  } catch (error) {
    logger.error(`Failed to get project ${projectId}:`, error);
    throw error;
  }
}

/**
 * 获取项目迭代列表
 */
export async function getIterations(projectId: string) {
  try {
    // TODO: 实现正确的API调用
    return [];
  } catch (error) {
    logger.warn(`Failed to get iterations for project ${projectId}:`, error);
    return [];
  }
}

/**
 * 获取项目成员列表
 */
export async function getProjectMembers(projectId: string) {
  try {
    // TODO: 实现正确的API调用
    return [];
  } catch (error) {
    logger.warn(`Failed to get members for project ${projectId}:`, error);
    return [];
  }
}
