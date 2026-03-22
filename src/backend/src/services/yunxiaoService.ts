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
 */
export async function getProjects() {
  try {
    console.log('[Yunxiao] Fetching projects...');
    console.log('[Yunxiao] Token:', YUNXIAO_TOKEN ? '存在' : '缺失');
    
    const response = await yunxiaoClient.post(
      `/organizations/${ORG_ID}/projects:search`,
      {
        page: 1,
        perPage: 50,
      }
    );
    
    console.log('[Yunxiao] Response type:', typeof response);
    console.log('[Yunxiao] Response isArray:', Array.isArray(response));
    
    // 检查响应格式
    if (!response) {
      console.error('[Yunxiao] Response is null/undefined');
      return [];
    }
    
    // API返回的是数组
    if (Array.isArray(response)) {
      console.log(`[Yunxiao] Found ${response.length} projects`);
      
      if (response.length === 0) {
        console.warn('[Yunxiao] Response array is empty');
        return [];
      }
      
      const projects = response.map((project: any) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        status: project.logicalStatus || 'active',
        createdAt: project.gmtCreate,
        updatedAt: project.gmtModified,
        iterationCount: 0,
        memberCount: 0,
        healthScore: 80,
      }));
      
      console.log('[Yunxiao] Mapped projects:', projects.length);
      return projects;
    }
    
    // 如果不是数组，记录错误
    console.error('[Yunxiao] Unexpected response format:', JSON.stringify(response).substring(0, 200));
    return [];
    
  } catch (error: any) {
    console.error('[Yunxiao] Error:', error.message);
    console.error('[Yunxiao] Error response:', error.response?.data);
    return [];
  }
}

export async function getProjectDetail(projectId: string) {
  try {
    const projects = await getProjects();
    const project = projects.find((p: any) => p.id === projectId);
    if (project) return project;
    throw new Error(`Project ${projectId} not found`);
  } catch (error) {
    console.error(`[Yunxiao] Failed to get project ${projectId}:`, error);
    throw error;
  }
}

export async function getIterations(projectId: string) {
  return [];
}

export async function getProjectMembers(projectId: string) {
  return [];
}
