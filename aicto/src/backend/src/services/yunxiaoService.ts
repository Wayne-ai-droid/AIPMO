import axios from 'axios';
import { logger } from '../utils/logger';

const YUNXIAO_BASE_URL = 'https://devops.aliyun.com/api';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || 'pt-fp0mbOxHhsplobOXhLDeiWW1_6155f38a-7ea6-47b6-9274-56447618cae1';

// 创建axios实例
const yunxiaoClient = axios.create({
  baseURL: YUNXIAO_BASE_URL,
  headers: {
    'Authorization': `Bearer ${YUNXIAO_TOKEN}`,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// 请求拦截器
yunxiaoClient.interceptors.request.use(
  (config) => {
    logger.info(`[Yunxiao API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    logger.error('[Yunxiao API Request Error]', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
yunxiaoClient.interceptors.response.use(
  (response) => {
    logger.info(`[Yunxiao API Response] ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    logger.error('[Yunxiao API Response Error]', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

/**
 * 获取当前用户信息
 */
export async function getCurrentUser() {
  try {
    const data = await yunxiaoClient.get('/organization/info');
    return data;
  } catch (error) {
    logger.error('Failed to get current user:', error);
    throw error;
  }
}

/**
 * 获取项目列表
 */
export async function getProjects() {
  try {
    const data = await yunxiaoClient.get('/projects');
    return data.data || [];
  } catch (error) {
    logger.error('Failed to get projects:', error);
    return [];
  }
}

/**
 * 获取项目详情
 */
export async function getProjectDetail(projectId: string) {
  try {
    const data = await yunxiaoClient.get(`/projects/${projectId}`);
    return data;
  } catch (error) {
    logger.error(`Failed to get project ${projectId}:`, error);
    throw error;
  }
}

/**
 * 获取工作项列表（需求/缺陷）
 */
export async function getWorkitems(
  projectId: string,
  workitemType?: string, // Requirement, Bug, Task
  status?: string
) {
  try {
    const params: any = {
      spaceType: 'Project',
      spaceIdentifier: projectId,
    };
    
    if (workitemType) {
      params.workitemType = workitemType;
    }
    
    if (status) {
      params.status = status;
    }

    const data = await yunxiaoClient.get('/workitems', { params });
    return data.data?.list || [];
  } catch (error) {
    logger.error(`Failed to get workitems for project ${projectId}:`, error);
    return [];
  }
}

/**
 * 获取需求列表
 */
export async function getDemands(projectId: string) {
  return getWorkitems(projectId, 'Requirement');
}

/**
 * 获取缺陷列表
 */
export async function getBugs(projectId: string) {
  return getWorkitems(projectId, 'Bug');
}

/**
 * 获取迭代列表
 */
export async function getIterations(projectId: string) {
  try {
    const data = await yunxiaoClient.get(`/projects/${projectId}/iterations`);
    return data.data || [];
  } catch (error) {
    logger.error(`Failed to get iterations for project ${projectId}:`, error);
    return [];
  }
}

/**
 * 同步项目数据到本地数据库
 */
export async function syncProjectData(projectId: string) {
  logger.info(`Starting sync for project ${projectId}`);
  
  try {
    // 并行获取项目数据
    const [projectDetail, demands, bugs, iterations] = await Promise.all([
      getProjectDetail(projectId),
      getDemands(projectId),
      getBugs(projectId),
      getIterations(projectId),
    ]);

    const result = {
      project: projectDetail,
      demands,
      bugs,
      iterations,
      syncedAt: new Date().toISOString(),
    };

    logger.info(`Sync completed for project ${projectId}:`, {
      demandsCount: demands.length,
      bugsCount: bugs.length,
    });

    return result;
  } catch (error) {
    logger.error(`Sync failed for project ${projectId}:`, error);
    throw error;
  }
}

export default {
  getCurrentUser,
  getProjects,
  getProjectDetail,
  getWorkitems,
  getDemands,
  getBugs,
  getIterations,
  syncProjectData,
};
