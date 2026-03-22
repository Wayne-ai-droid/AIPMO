import { Router } from 'express';
import { prisma } from '../index';
import * as yunxiaoService from '../services/yunxiaoService';
import { logger } from '../utils/logger';

const router = Router();

// 项目ID配置
const DEFAULT_PROJECT_ID = 'e55139fd2a036662c391e0181b';

// POST /api/sync/projects - 同步所有项目数据
router.post('/projects', async (req, res, next) => {
  try {
    const { projectIds } = req.body;
    
    // 如果没有指定项目ID，使用默认项目
    const projectsToSync = projectIds || [{ 
      id: 1, 
      yunxiaoProjectId: DEFAULT_PROJECT_ID,
      name: 'MFP项目'
    }];

    const results = [];
    
    for (const project of projectsToSync) {
      if (!project.yunxiaoProjectId) {
        logger.warn(`Project ${project.name} has no yunxiaoProjectId, skipping`);
        continue;
      }

      try {
        // 记录同步开始
        const syncLog = await prisma.syncLog.create({
          data: {
            projectId: project.id,
            source: 'yunxiao',
            syncType: 'incremental',
            status: 'running',
            startedAt: new Date(),
          }
        });

        // 从云效获取数据
        const yunxiaoData = await yunxiaoService.syncProjectData(project.yunxiaoProjectId);

        // 保存冲刺数据到数据库（使用Iteration模型）
        for (const sprint of yunxiaoData.sprints) {
          await prisma.iteration.upsert({
            where: { yunxiaoId: sprint.id },
            update: {
              name: sprint.name,
              status: mapStatus(sprint.status),
              startDate: new Date(sprint.startDate),
              endDate: new Date(sprint.endDate),
              owner: sprint.owners?.[0]?.name || sprint.creator?.name,
              updatedAt: new Date(),
            },
            create: {
              projectId: project.id,
              yunxiaoId: sprint.id,
              name: sprint.name,
              status: mapStatus(sprint.status),
              startDate: new Date(sprint.startDate),
              endDate: new Date(sprint.endDate),
              owner: sprint.owners?.[0]?.name || sprint.creator?.name,
            },
          });
        }

        // 更新同步日志
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'success',
            recordCount: yunxiaoData.sprints.length + yunxiaoData.members.length,
            completedAt: new Date(),
          }
        });

        results.push({
          projectId: project.id,
          name: project.name,
          status: 'success',
          sprints: yunxiaoData.sprints.length,
          members: yunxiaoData.members.length,
        });

      } catch (error) {
        logger.error(`Failed to sync project ${project.name}:`, error);
        
        // 记录失败日志
        await prisma.syncLog.create({
          data: {
            projectId: project.id,
            source: 'yunxiao',
            syncType: 'incremental',
            status: 'failed',
            errorMessage: (error as Error).message,
            startedAt: new Date(),
            completedAt: new Date(),
          }
        });

        results.push({
          projectId: project.id,
          name: project.name,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    res.json({
      success: true,
      data: {
        syncedAt: new Date().toISOString(),
        results,
      }
    });

  } catch (error) {
    next(error);
  }
});

// POST /api/sync/project/:id - 同步单个项目
router.post('/project/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id === 'default' ? DEFAULT_PROJECT_ID : req.params.id;
    
    const result = await yunxiaoService.syncProjectData(projectId);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/sync/project/:id - 获取单个项目同步数据（不保存到数据库）
router.get('/project/:id', async (req, res, next) => {
  try {
    const projectId = req.params.id === 'default' ? DEFAULT_PROJECT_ID : req.params.id;
    
    const result = await yunxiaoService.syncProjectData(projectId);

    res.json({
      success: true,
      data: result,
    });

  } catch (error) {
    next(error);
  }
});

// GET /api/sync/logs - 获取同步日志
router.get('/logs', async (req, res, next) => {
  try {
    const { projectId, limit = 50 } = req.query;
    
    const logs = await prisma.syncLog.findMany({
      where: projectId ? { projectId: parseInt(projectId as string) } : undefined,
      orderBy: { startedAt: 'desc' },
      take: parseInt(limit as string),
      include: {
        project: {
          select: { name: true }
        }
      }
    });

    res.json({
      success: true,
      data: logs,
    });

  } catch (error) {
    next(error);
  }
});

// 状态映射函数
function mapStatus(yunxiaoStatus: string): string {
  const statusMap: Record<string, string> = {
    'TODO': 'todo',
    'DOING': 'doing',
    'DONE': 'done',
    'CLOSED': 'closed',
  };
  return statusMap[yunxiaoStatus] || yunxiaoStatus.toLowerCase();
}

function mapBugStatus(yunxiaoStatus: string): string {
  const statusMap: Record<string, string> = {
    'NEW': 'new',
    'FIXING': 'fixing',
    'FIXED': 'fixed',
    'CLOSED': 'closed',
  };
  return statusMap[yunxiaoStatus] || yunxiaoStatus.toLowerCase();
}

function calculateProgress(status: string): number {
  const progressMap: Record<string, number> = {
    'TODO': 0,
    'DOING': 50,
    'DONE': 100,
    'CLOSED': 100,
  };
  return progressMap[status] || 0;
}

export default router;
