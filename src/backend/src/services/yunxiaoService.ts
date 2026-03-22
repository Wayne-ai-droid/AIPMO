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

export async function getProjects() {
  try {
    console.log('[Yunxiao] 开始获取项目...');
    console.log('[Yunxiao] Token是否存在:', !!YUNXIAO_TOKEN);
    
    const response = await yunxiaoClient.post(
      `/organizations/${ORG_ID}/projects:search`,
      { page: 1, perPage: 50 }
    );
    
    // 直接返回response（axios拦截器已处理response.data）
    const data = response as any;
    
    console.log('[Yunxiao] 响应数据类型:', typeof data);
    console.log('[Yunxiao] 是否为数组:', Array.isArray(data));
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`[Yunxiao] 成功获取 ${data.length} 个项目`);
      return data.map((project: any) => ({
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
    }
    
    console.log('[Yunxiao] 响应为空或格式不对');
    return [];
  } catch (error: any) {
    console.error('[Yunxiao] 错误:', error.message);
    return [];
  }
}

export async function getProjectDetail(projectId: string) {
  const projects = await getProjects();
  return projects.find((p: any) => p.id === projectId) || null;
}

export async function getIterations(projectId: string) {
  return [];
}

export async function getProjectMembers(projectId: string) {
  return [];
}
