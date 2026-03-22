import axios from 'axios';
import { logger } from '../utils/logger';

const YUNXIAO_BASE_URL = 'https://openapi-rdc.aliyuncs.com/oapi/v1/projex';
const YUNXIAO_ORG_ID = process.env.YUNXIAO_ORG_ID || '6925baaef9c52e7d8c27b51b';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || '';

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
      errorCode: error.response?.data?.errorCode,
      errorMessage: error.response?.data?.errorMessage || error.message,
      url: error.config?.url,
    });
    return Promise.reject(error);
  }
);

/**
 * 获取项目冲刺列表
 */
export async function getSprints(projectId: string) {
  try {
    const data = await yunxiaoClient.get(
      `/organizations/${YUNXIAO_ORG_ID}/projects/${projectId}/sprints`
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error(`Failed to get sprints for project ${projectId}:`, error);
    return [];
  }
}

/**
 * 获取项目成员列表
 */
export async function getProjectMembers(projectId: string) {
  try {
    const data = await yunxiaoClient.get(
      `/organizations/${YUNXIAO_ORG_ID}/projects/${projectId}/members`
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    logger.error(`Failed to get members for project ${projectId}:`, error);
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
    const [sprints, members] = await Promise.all([
      getSprints(projectId),
      getProjectMembers(projectId),
    ]);

    const result = {
      projectId,
      organizationId: YUNXIAO_ORG_ID,
      sprints,
      members,
      sprintsCount: sprints.length,
      membersCount: members.length,
      syncedAt: new Date().toISOString(),
    };

    logger.info(`Sync completed for project ${projectId}:`, {
      sprintsCount: sprints.length,
      membersCount: members.length,
    });

    return result;
  } catch (error) {
    logger.error(`Sync failed for project ${projectId}:`, error);
    throw error;
  }
}

export default {
  getSprints,
  getProjectMembers,
  syncProjectData,
};
