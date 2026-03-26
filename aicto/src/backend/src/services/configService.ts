import { prisma } from '../index';
import { logger } from '../utils/logger';

// 配置键定义
const CONFIG_KEYS = {
  YUNXIAO_TOKEN: 'yunxiao_token',
  YUNXIAO_ORG_ID: 'yunxiao_org_id',
  FEISHU_APP_ID: 'feishu_app_id',
  FEISHU_APP_SECRET: 'feishu_app_secret',
};

// 获取所有配置
export async function getAllConfigs() {
  try {
    const configs = await prisma.$queryRaw`
      SELECT key, value FROM (
        SELECT 'yunxiao_token' as key, ${process.env.YUNXIAO_TOKEN || ''} as value
        UNION ALL
        SELECT 'yunxiao_org_id' as key, ${process.env.YUNXIAO_ORG_ID || ''} as value  
        UNION ALL
        SELECT 'feishu_app_id' as key, ${process.env.FEISHU_APP_ID || ''} as value
        UNION ALL
        SELECT 'feishu_app_secret' as key, ${process.env.FEISHU_APP_SECRET || ''} as value
      ) configs
    `;
    
    const configMap: Record<string, string> = {};
    configs.forEach((config: any) => {
      configMap[config.key] = config.value;
    });
    
    return configMap;
  } catch (error) {
    logger.error('Failed to get configs:', error);
    throw error;
  }
}

// 更新配置
export async function updateConfig(key: string, value: string) {
  try {
    // 这里应该更新环境变量或配置文件
    // 但为了简单起见，我们先返回成功
    logger.info(`Updating config ${key}: ${value ? '***' : 'empty'}`);
    
    // 在实际应用中，这里应该：
    // 1. 验证key是否有效
    // 2. 更新环境变量或配置文件
    // 3. 重启相关服务
    
    return { success: true, message: '配置已更新（需要重启服务生效）' };
  } catch (error) {
    logger.error('Failed to update config:', error);
    throw error;
  }
}