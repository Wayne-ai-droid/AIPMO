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
 * 获取项目列表（使用正确的API路径）
 * API文档: POST /oapi/v1/projex/organizations/{organizationId}/programs:search
 */
export async function getProjects() {
  try {
    logger.info('Fetching projects from Yunxiao API...');
    
    const response: any = await yunxiaoClient.post(
      `/organizations/${ORG_ID}/programs:search`,
      {
        page: 1,
        perPage: 50,
      }
    );
    
    logger.info('Yunxiao API response:', response);
    
    // 返回项目列表（API返回的是数组）
    if (Array.isArray(response)) {
      return response.map((program: any) => ({
        id: program.id,
        name: program.name,
        description: program.description || '',
        status: program.logicalStatus || 'active',
        createdAt: program.gmtCreate,
        updatedAt: program.gmtModified,
        // 这些字段需要从其他API获取或估算
        iterationCount: 0,
        memberCount: 0,
        healthScore: 80,
      }));
    }
    
    logger.warn('Unexpected response format:', response);
    return [];
  } catch (error) {
    logger.error('Failed to get projects from Yunxiao:', error);
    return [];
  }
}

/**
 * 获取项目详情
 */
export async function getProjectDetail(projectId: string) {
  try {
    logger.info(`Fetching project ${projectId}...`);
    
    // 先搜索项目列表，然后找到匹配的项目
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
 * TODO: 需要找到正确的API路径
 */
export async function getIterations(projectId: string) {
  try {
    logger.info(`Fetching iterations for project ${projectId}...`);
    // 暂时返回空数组，需要找到正确的API
    return [];
  } catch (error) {
    logger.warn(`Failed to get iterations for project ${projectId}:`, error);
    return [];
  }
}

/**
 * 获取项目成员列表
 * TODO: 需要找到正确的API路径
 */
export async function getProjectMembers(projectId: string) {
  try {
    logger.info(`Fetching members for project ${projectId}...`);
    // 暂时返回空数组，需要找到正确的API
    return [];
  } catch (error) {
    logger.warn(`Failed to get members for project ${projectId}:`, error);
    return [];
  }
}
