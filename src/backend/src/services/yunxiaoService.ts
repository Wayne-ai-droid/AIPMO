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
      message: error.response?.data?.errorMessage || error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

/**
 * 获取项目列表
 */
export async function getProjects() {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects`);
    
    if (response.result) {
      return response.result;
    } else if (response.data) {
      return response.data;
    } else if (Array.isArray(response)) {
      return response;
    }
    
    logger.warn('Unexpected response format from getProjects:', response);
    return [];
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
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}`);
    return response.result || response.data || response;
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
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}/sprints`);
    return response.result || response.data || [];
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
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}/members`);
    return response.result || response.data || [];
  } catch (error) {
    logger.warn(`Failed to get members for project ${projectId}:`, error);
    return [];
  }
}
