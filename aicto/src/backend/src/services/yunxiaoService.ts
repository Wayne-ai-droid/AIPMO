import axios from 'axios';
import { logger } from '../utils/logger';

const YUNXIAO_BASE_URL = 'https://openapi-rdc.aliyuncs.com/oapi/v1/projex';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || '';
const ORG_ID = '6925baaef9c52e7d8c27b51b';

const yunxiaoClient = axios.create({
  baseURL: YUNXIAO_BASE_URL,
  headers: {
    'x-yunxiao-token': YUNXIAO_TOKEN,
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

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

export async function getProjects() {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects`);
    if (response.result) return response.result;
    if (response.data) return response.data;
    if (Array.isArray(response)) return response;
    return [];
  } catch (error) {
    logger.error('Failed to get projects:', error);
    return [];
  }
}

export async function getProjectDetail(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}`);
    return response.result || response.data || response;
  } catch (error) {
    logger.error(`Failed to get project ${projectId}:`, error);
    throw error;
  }
}

export async function getIterations(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(`/organizations/${ORG_ID}/projects/${projectId}/sprints`);
    return response.result || response.data || [];
  } catch (error) {
    return [];
  }
}
