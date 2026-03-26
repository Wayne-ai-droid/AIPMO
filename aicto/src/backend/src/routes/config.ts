import { Router } from 'express';
import { prisma } from '../index';
import { logger } from '../utils/logger';
import * as yunxiaoService from '../services/yunxiaoService';

const router = Router();

// GET /api/config - 获取当前配置
router.get('/', async (req, res, next) => {
  try {
    // 从环境变量获取当前配置
    const config = {
      yunxiaoToken: process.env.YUNXIAO_TOKEN || '',
      yunxiaoBaseUrl: process.env.YUNXIAO_BASE_URL || 'https://devops.aliyun.com/api',
      yunxiaoOrgId: process.env.ORGANIZATION_ID || ''
    };
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/config - 更新配置并测试连接
router.post('/', async (req, res, next) => {
  try {
    // 兼容两种字段名：yunxiaoOrgId 和 organizationId
    const { 
      yunxiaoToken, 
      yunxiaoBaseUrl, 
      yunxiaoOrgId,
      organizationId 
    } = req.body;
    
    const orgId = yunxiaoOrgId || organizationId;
    
    // 验证必填字段
    if (!yunxiaoToken || !orgId) {
      return res.status(400).json({
        success: false,
        message: '云效Token和组织ID是必填项'
      });
    }

    // 测试连接 - 尝试获取项目列表
    try {
      // 临时设置环境变量用于测试
      const testToken = yunxiaoToken;
      const testOrgId = orgId;
      const testBaseUrl = yunxiaoBaseUrl || 'https://devops.aliyun.com/api';
      
      // 这里暂时不进行实际的API调用测试，先保存配置
      // 实际测试可以在单独的测试接口中进行
      
      // 更新环境变量（注意：这在开发环境中有效，生产环境需要重启）
      process.env.YUNXIAO_TOKEN = yunxiaoToken;
      process.env.YUNXIAO_BASE_URL = yunxiaoBaseUrl || 'https://devops.aliyun.com/api';
      process.env.ORGANIZATION_ID = orgId;
      
      // 更新 .env 文件
      const fs = require('fs');
      const envPath = './.env';
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // 更新或添加配置
      envContent = envContent.replace(/YUNXIAO_TOKEN=.*/, `YUNXIAO_TOKEN=${yunxiaoToken}`);
      envContent = envContent.replace(/YUNXIAO_BASE_URL=.*/, `YUNXIAO_BASE_URL=${yunxiaoBaseUrl || 'https://devops.aliyun.com/api'}`);
      
      // 添加或更新 ORGANIZATION_ID
      if (envContent.includes('ORGANIZATION_ID=')) {
        envContent = envContent.replace(/ORGANIZATION_ID=.*/, `ORGANIZATION_ID=${orgId}`);
      } else {
        envContent += `\nORGANIZATION_ID=${orgId}`;
      }
      
      fs.writeFileSync(envPath, envContent);
      
      res.json({
        success: true,
        message: '配置保存成功！',
        data: {
          yunxiaoToken: yunxiaoToken,
          yunxiaoOrgId: orgId
        }
      });
      
    } catch (error: any) {
      logger.error('配置保存失败:', error);
      return res.status(500).json({
        success: false,
        message: `配置保存失败: ${error.message || '未知错误'}`
      });
    }
    
  } catch (error) {
    next(error);
  }
});

export default router;