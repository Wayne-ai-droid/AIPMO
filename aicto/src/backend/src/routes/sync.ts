import { Router } from 'express';
import { prisma } from '../index';
import * as yunxiaoService from '../services/yunxiaoService';
import { getProjectMembers } from '../services/yunxiaoService';
import { logger } from '../utils/logger';

const router = Router();

// POST /api/sync/projects - 同步所有项目数据
router.post('/projects', async (req, res, next) => {
  try {
    const { projectIds } = req.body;

    // 从云效获取项目列表
    let yunxiaoProjects: any[] = [];
    if (projectIds && projectIds.length > 0) {
      yunxiaoProjects = projectIds.map((id: any) => ({ id, name: `项目-${id}` }));
    } else {
      yunxiaoProjects = await yunxiaoService.getProjects();
    }

    if (!yunxiaoProjects || yunxiaoProjects.length === 0) {
      return res.json({ success: true, message: '云效未返回任何项目', synced: 0 });
    }

    const results = [];

    for (const proj of yunxiaoProjects) {
      if (!proj.id) continue;

      try {
        // 1. 获取成员数
        const members = await getProjectMembers(proj.id);
        const memberCount = members.length;

        // 2. 先将项目 upsert 到数据库
        const dbProject = await prisma.project.upsert({
          where: { yunxiaoProjectId: proj.id },
          update: {
            name: proj.name || `项目-${proj.id}`,
            description: proj.description || '',
            status: 'active',
            memberCount,
            updatedAt: new Date(),
          },
          create: {
            yunxiaoProjectId: proj.id,
            name: proj.name || `项目-${proj.id}`,
            description: proj.description || '',
            status: 'active',
            memberCount,
          },
        });

        // 2. 记录同步日志
        const syncLog = await prisma.syncLog.create({
          data: {
            projectId: dbProject.id,
            source: 'yunxiao',
            syncType: 'incremental',
            status: 'running',
            startedAt: new Date(),
          }
        });

        // 3. 从云效获取冲刺数据
        const sprints = await yunxiaoService.getIterations(proj.id);

        // 4. 保存冲刺数据
        for (const sprint of sprints) {
          await prisma.iteration.upsert({
            where: { yunxiaoId: sprint.id },
            update: {
              name: sprint.name,
              status: mapStatus(sprint.status),
              startDate: sprint.startDate ? new Date(sprint.startDate) : null,
              endDate: sprint.endDate ? new Date(sprint.endDate) : null,
              owner: sprint.owners?.[0]?.name || sprint.creator?.name,
              updatedAt: new Date(),
            },
            create: {
              projectId: dbProject.id,
              yunxiaoId: sprint.id,
              name: sprint.name,
              status: mapStatus(sprint.status),
              startDate: sprint.startDate ? new Date(sprint.startDate) : null,
              endDate: sprint.endDate ? new Date(sprint.endDate) : null,
              owner: sprint.owners?.[0]?.name || sprint.creator?.name,
            },
          });
        }

        // 更新同步日志
        await prisma.syncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'success',
            recordCount: sprints.length,
            completedAt: new Date(),
          }
        });

        results.push({
          projectId: dbProject.id,
          name: proj.name,
          status: 'success',
          sprints: sprints.length,
        });

      } catch (error) {
        logger.error(`Failed to sync project ${proj.name}:`, error);

        results.push({
          projectId: proj.id,
          name: proj.name,
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
    let projectId = req.params.id;
    if (projectId === 'default') {
      const firstProject = await prisma.project.findFirst({ where: { yunxiaoProjectId: { not: null } } });
      if (!firstProject?.yunxiaoProjectId) {
        return res.json({ success: true, data: null, message: '暂无项目数据，请先同步' });
      }
      projectId = firstProject.yunxiaoProjectId;
    }

    const result = await yunxiaoService.getProjectDetail(projectId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET /api/sync/project/:id - 获取单个项目同步数据（不保存到数据库）
router.get('/project/:id', async (req, res, next) => {
  try {
    let projectId = req.params.id;
    if (projectId === 'default') {
      const firstProject = await prisma.project.findFirst({ where: { yunxiaoProjectId: { not: null } } });
      if (!firstProject?.yunxiaoProjectId) {
        return res.json({ success: true, data: null, message: '暂无项目数据，请先同步' });
      }
      projectId = firstProject.yunxiaoProjectId;
    }

    const result = await yunxiaoService.getProjectDetail(projectId);
    res.json({ success: true, data: result });
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

export default router;