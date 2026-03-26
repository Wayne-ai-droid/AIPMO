import axios from 'axios';
import { logger } from '../utils/logger';

// 修正：使用正确的基础URL
const YUNXIAO_BASE_URL = 'https://openapi-rdc.aliyuncs.com';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || '';
const ORG_ID = process.env.YUNXIAO_ORG_ID || '6925baaef9c52e7d8c27b51b';

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
    return response.data; // 直接返回data，因为API直接返回数组
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

// 修正：使用正确的POST请求和端点获取项目列表
export async function getProjects() {
  try {
    // 使用正确的端点格式
    const response: any = await yunxiaoClient.post(
      `/oapi/v1/projex/organizations/${ORG_ID}/projects:search`,
      {
        page: 1,
        perPage: 100
      }
    );
    
    // 根据curl测试结果，API直接返回数组
    if (Array.isArray(response)) {
      return response;
    }
    
    // 兼容其他可能的响应格式
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    
    if (response && Array.isArray(response.result)) {
      return response.result;
    }
    
    logger.warn('Unexpected response format from Yunxiao API:', response);
    return [];
    
  } catch (error) {
    logger.error('Failed to get projects:', error);
    return [];
  }
}

// 获取单个项目详情（如果需要）
export async function getProjectDetail(projectId: string) {
  try {
    const response: any = await yunxiaoClient.post(
      `/oapi/v1/projex/projects/${projectId}:get`
    );
    return response;
  } catch (error) {
    logger.error(`Failed to get project ${projectId}:`, error);
    throw error;
  }
}

// 获取冲刺/迭代数据
export async function getIterations(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(
      `/oapi/v1/projex/organizations/${ORG_ID}/projects/${projectId}/sprints`
    );
    
    if (Array.isArray(response)) {
      return response;
    }
    
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    
    return [];
  } catch (error) {
    logger.error(`Failed to get iterations for project ${projectId}:`, error);
    return [];
  }
}

// 获取项目成员列表
export async function getProjectMembers(projectId: string) {
  try {
    const response: any = await yunxiaoClient.get(
      `/oapi/v1/projex/organizations/${ORG_ID}/projects/${projectId}/members`
    );
    if (Array.isArray(response)) {
      return response;
    }
    if (response && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error(`Failed to get members for project ${projectId}:`, error);
    return [];
  }
}

// 新增：测试连接函数
export async function testConnection() {
  try {
    const projects = await getProjects();
    return {
      success: true,
      message: `连接成功，找到 ${projects.length} 个项目`,
      projectsCount: projects.length
    };
  } catch (error: any) {
    return {
      success: false,
      message: `连接失败: ${error.message || '未知错误'}`
    };
  }
}