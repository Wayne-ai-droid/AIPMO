import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/dashboard/overview - 获取全局概览数据
router.get('/overview', async (req, res, next) => {
  try {
    // 统计项目总数
    const totalProjects = await prisma.project.count({
      where: { status: 'active' }
    });

    // 统计需求总数
    const totalDemands = await prisma.demand.count();

    // 统计待修复缺陷
    const pendingBugs = await prisma.bug.count({
      where: {
        status: {
          notIn: ['closed', 'fixed']
        }
      }
    });

    // 统计风险项目（健康度<60）
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      include: {
        demands: {
          select: { status: true, progress: true }
        },
        bugs: {
          select: { status: true, severity: true }
        }
      }
    });

    let riskProjects = 0;
    for (const project of projects) {
      const progressScore = calculateProgressScore(project.demands);
      const qualityScore = calculateQualityScore(project.bugs);
      const healthScore = progressScore * 0.4 + qualityScore * 0.3 + 100 * 0.3;
      
      if (healthScore < 60) {
        riskProjects++;
      }
    }

    // 获取项目健康度列表
    const projectHealthList = projects.map(project => {
      const progressScore = calculateProgressScore(project.demands);
      const qualityScore = calculateQualityScore(project.bugs);
      const healthScore = Math.round(progressScore * 0.4 + qualityScore * 0.3 + 100 * 0.3);

      return {
        id: project.id,
        name: project.name,
        healthScore,
        status: getHealthStatus(healthScore),
        progress: Math.round(progressScore),
        pendingBugs: project.bugs.filter(b => b.status !== 'closed').length
      };
    });

    // 按健康度排序（低的在前）
    projectHealthList.sort((a, b) => a.healthScore - b.healthScore);

    res.json({
      success: true,
      data: {
        stats: {
          totalProjects,
          totalDemands,
          pendingBugs,
          riskProjects
        },
        projects: projectHealthList
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/projects/:id - 获取项目Dashboard数据
router.get('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    // 获取项目基本信息
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        demands: true,
        bugs: true
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 需求统计
    const demandStats = {
      total: project.demands.length,
      todo: project.demands.filter(d => d.status === 'todo').length,
      doing: project.demands.filter(d => d.status === 'doing').length,
      done: project.demands.filter(d => d.status === 'done').length,
      progress: calculateDemandProgress(project.demands)
    };

    // 缺陷统计
    const bugStats = {
      total: project.bugs.length,
      new: project.bugs.filter(b => b.status === 'new').length,
      fixing: project.bugs.filter(b => b.status === 'fixing').length,
      fixed: project.bugs.filter(b => b.status === 'fixed').length,
      closed: project.bugs.filter(b => b.status === 'closed').length,
      bySeverity: {
        fatal: project.bugs.filter(b => b.severity === 'fatal').length,
        serious: project.bugs.filter(b => b.severity === 'serious').length,
        normal: project.bugs.filter(b => b.severity === 'normal').length
      }
    };

    // 计算健康度
    const progressScore = calculateProgressScore(project.demands);
    const qualityScore = calculateQualityScore(project.bugs);
    const healthScore = Math.round(progressScore * 0.4 + qualityScore * 0.3 + 100 * 0.3);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          healthScore,
          healthStatus: getHealthStatus(healthScore)
        },
        demands: demandStats,
        bugs: bugStats
      }
    });
  } catch (error) {
    next(error);
  }
});

// 辅助函数：计算需求进度得分
function calculateProgressScore(demands: any[]) {
  if (demands.length === 0) return 100;
  const totalProgress = demands.reduce((sum, d) => sum + (d.progress || 0), 0);
  return totalProgress / demands.length;
}

// 辅助函数：计算质量得分
function calculateQualityScore(bugs: any[]) {
  if (bugs.length === 0) return 100;
  const closedBugs = bugs.filter(b => b.status === 'closed').length;
  return (closedBugs / bugs.length) * 100;
}

// 辅助函数：计算需求完成进度
function calculateDemandProgress(demands: any[]) {
  if (demands.length === 0) return 0;
  const done = demands.filter(d => d.status === 'done').length;
  return Math.round((done / demands.length) * 100);
}

// 辅助函数：获取健康度状态
function getHealthStatus(score: number) {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'danger';
}

export default router;
