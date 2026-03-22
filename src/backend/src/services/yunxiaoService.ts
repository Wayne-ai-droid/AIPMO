import axios from 'axios';

const YUNXIAO_BASE_URL = 'https://openapi-rdc.aliyuncs.com/oapi/v1/projex';
const YUNXIAO_TOKEN = process.env.YUNXIAO_TOKEN || '';
const ORG_ID = '6925baaef9c52e7d8c27b51b';

export async function getProjects(): Promise<any[]> {
  const url = `${YUNXIAO_BASE_URL}/organizations/${ORG_ID}/projects:search`;
  
  console.log('[Yunxiao] 请求URL:', url);
  console.log('[Yunxiao] Token:', YUNXIAO_TOKEN ? '存在' : '缺失');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-yunxiao-token': YUNXIAO_TOKEN,
      },
      body: JSON.stringify({ page: 1, perPage: 50 }),
    });
    
    if (!response.ok) {
      console.error('[Yunxiao] HTTP错误:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    console.log('[Yunxiao] 响应类型:', typeof data);
    console.log('[Yunxiao] 是否为数组:', Array.isArray(data));
    
    if (Array.isArray(data)) {
      console.log('[Yunxiao] 项目数量:', data.length);
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
    
    console.log('[Yunxiao] 响应不是数组');
    return [];
  } catch (error: any) {
    console.error('[Yunxiao] 请求失败:', error.message);
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
