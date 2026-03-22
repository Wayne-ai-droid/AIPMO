import { Router } from 'express';
import { prisma } from '../index';
import * as yunxiaoService from '../services/yunxiaoService';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/sync/projects - 同步所有项目数据
router.post('/projects', async (req, res, next) => {
  try {
    const { projectIds } = req.body;
    
    // 如果没有指定项目ID，则同步所有配置的项目
    const projectsToSync = projectIds || (await prisma.project.findMany({
      where: { status: 'active' },
      select: { id: true, yunxiaoProjectId: true, name: true }
    }));

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

        // 保存需求数据
        for (const demand of yunxiaoData.demands) {
          await prisma.demand.upsert({
            where: { yunxiaoId: demand.id },
            update: {
              title: demand.title,
              status: mapStatus(demand.status),
              priority: demand.priority,
              assignee: demand.assignee?.name,
              progress: calculateProgress(demand.status),
              updatedAt: new Date(),
              rawData: demand,
            },
            create: {
              projectId: project.id,
              yunxiaoId: demand.id,
              title: demand.title,
              status: mapStatus(demand.status),
              priority: demand.priority,
              assignee: demand.assignee?.name,
              progress: calculateProgress(demand.status),
              rawData: demand,
            },
          });
        }

        // 保存缺陷数据
        for (const bug of yunxiaoData.bugs) {
          await prisma.bug.upsert({
            where: { yunxiaoId: bug.id },
            update: {
              title: bug.title,
              status: mapBugStatus(bug.status),
              severity: bug.severity,
              priority: bug.priority,
              assignee: bug.assignee?.name,
              updatedAt: new Date(),
              rawData: bug,
            },
            create: {
              projectId: project.id,
              yunxiaoId: bug.id,
              title: bug.title,
              status: mapBugStatus(bug.status),
              severity: bug.severity,
              priority: bug.priority,
              assignee: bug.assignee?.name,
              rawData: bug,
            },
          });
        }

        // 更新同步日志
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'success',
            recordCount: yunxiaoData.demands.length + yunxiaoData.bugs.length,
            completedAt: new Date(),
          }
        });

        results.push({
          projectId: project.id,
          name: project.name,
          status: 'success',
          demands: yunxiaoData.demands.length,
          bugs: yunxiaoData.bugs.length,
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
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project || !project.yunxiaoProjectId) {
      return res.status(400).json({ error: 'Project not found or no yunxiaoProjectId' });
    }

    const result = await yunxiaoService.syncProjectData(project.yunxiaoProjectId);

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
