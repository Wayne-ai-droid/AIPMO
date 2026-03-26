import cron from 'node-cron';
import { prisma } from '../index';
import * as yunxiaoService from '../services/yunxiaoService';
import { logger } from '../utils/logger';

/**
 * 启动所有定时任务
 */
export function startCronJobs() {
  logger.info('Starting cron jobs...');

  // 每15分钟同步一次项目数据
  cron.schedule('*/15 * * * *', async () => {
    logger.info('[Cron] Starting scheduled project sync');
    try { await syncAllProjects(); } catch (e) { logger.error('[Cron] syncAllProjects crashed:', e); }
  });

  // 每小时生成一次项目健康度报告
  cron.schedule('0 * * * *', async () => {
    logger.info('[Cron] Starting health score calculation');
    try { await calculateAllHealthScores(); } catch (e) { logger.error('[Cron] calculateAllHealthScores crashed:', e); }
  });

  // 每天凌晨2点进行全量同步
  cron.schedule('0 2 * * *', async () => {
    logger.info('[Cron] Starting daily full sync');
    try { await fullSyncAllProjects(); } catch (e) { logger.error('[Cron] fullSyncAllProjects crashed:', e); }
  });

  logger.info('Cron jobs started successfully');
}

/**
 * 同步所有活跃项目
 */
async function syncAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
    });

    for (const project of projects) {
      if (!project.yunxiaoProjectId) continue;

      try {
        // 使用现有的云效服务函数获取冲刺数据
        const sprints = await yunxiaoService.getIterations(project.yunxiaoProjectId);
        
        // 记录同步日志
        const syncLog = await prisma.syncLog.create({
          data: {
            projectId: project.id,
            source: 'yunxiao',
            syncType: 'incremental',
            status: 'running',
            startedAt: new Date(),
          }
        });

        // 保存冲刺数据到数据库
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
              projectId: project.id,
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
      }
    }

    logger.info(`[Cron] Completed sync for ${projects.length} projects`);
  } catch (error) {
    logger.error('[Cron] Failed to sync all projects:', error);
  }
}

/**
 * 计算所有项目的健康度
 */
async function calculateAllHealthScores() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      include: {
        demands: true,
        bugs: true,
      }
    });

    for (const project of projects) {
      const healthScore = calculateHealthScore(project.demands, project.bugs);
      
      await prisma.project.update({
        where: { id: project.id },
        data: { healthScore }
      });
    }

    logger.info(`[Cron] Calculated health scores for ${projects.length} projects`);
  } catch (error) {
    logger.error('[Cron] Failed to calculate health scores:', error);
  }
}

/**
 * 计算项目健康度得分
 */
function calculateHealthScore(demands: any[], bugs: any[]): number {
  // 进度得分 (40%)
  const progressScore = demands.length > 0 
    ? demands.reduce((sum, d) => sum + (d.progress || 0), 0) / demands.length 
    : 100;

  // 质量得分 (30%)
  const qualityScore = bugs.length > 0
    ? (bugs.filter(b => b.status === 'closed').length / bugs.length) * 100
    : 100;

  // 风险得分 (30%)
  let riskScore = 100;
  const activeBugs = bugs.filter(b => b.status !== 'closed');
  const fatalBugs = activeBugs.filter(b => b.severity === 'fatal').length;
  if (fatalBugs > 0) {
    riskScore -= fatalBugs * 20;
  }

  // 综合得分
  return Math.round(progressScore * 0.4 + qualityScore * 0.3 + Math.max(0, riskScore) * 0.3);
}

/**
 * 全量同步所有项目
 */
async function fullSyncAllProjects() {
  try {
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
    });

    for (const project of projects) {
      if (!project.yunxiaoProjectId) continue;

      try {
        // 使用现有的云效服务函数获取冲刺数据
        const sprints = await yunxiaoService.getIterations(project.yunxiaoProjectId);
        
        // 记录全量同步日志
        const syncLog = await prisma.syncLog.create({
          data: {
            projectId: project.id,
            source: 'yunxiao',
            syncType: 'full',
            status: 'running',
            startedAt: new Date(),
          }
        });

        // 保存冲刺数据到数据库
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
              projectId: project.id,
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

      } catch (error) {
        logger.error(`Full sync failed for project ${project.name}:`, error);
        
        // 记录失败日志
        await prisma.syncLog.create({
          data: {
            projectId: project.id,
            source: 'yunxiao',
            syncType: 'full',
            status: 'failed',
            errorMessage: (error as Error).message,
            startedAt: new Date(),
            completedAt: new Date(),
          }
        });
      }
    }

    logger.info(`[Cron] Completed full sync for ${projects.length} projects`);
  } catch (error) {
    logger.error('[Cron] Failed to full sync all projects:', error);
  }
}

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

export default {
  startCronJobs,
};