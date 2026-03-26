import { Router } from 'express';
import { prisma } from '../index';
import { calculateProjectHealth } from '../services/healthService';

const router = Router();

// GET /api/projects - 获取项目列表
router.get('/', async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            demands: true,
            bugs: true,
            iterations: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // 计算每个项目的健康度
    const projectsWithHealth = await Promise.all(
      projects.map(async (project) => {
        let health = { score: project.healthScore, status: 'good' };
        try {
          const h = await calculateProjectHealth(project.id);
          health = { score: h.score, status: h.status };
        } catch (e) {}
        return {
          ...project,
          iterationCount: project._count.iterations,
          healthScore: health.score,
          healthStatus: health.status
        };
      })
    );

    res.json({
      success: true,
      data: projectsWithHealth
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/projects/:id - 获取项目详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            demands: true,
            bugs: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // 获取健康度详情
    const health = await calculateProjectHealth(project.id);

    res.json({
      success: true,
      data: {
        ...project,
        healthScore: health.score,
        healthStatus: health.status,
        healthDetails: health.details
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/projects - 创建项目
router.post('/', async (req, res, next) => {
  try {
    const { name, yunxiaoProjectId, feishuChatId, githubRepo, config } = req.body;
    
    const project = await prisma.project.create({
      data: {
        name,
        yunxiaoProjectId,
        feishuChatId,
        githubRepo,
        config: config || {}
      }
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/projects/:id - 更新项目
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, yunxiaoProjectId, feishuChatId, githubRepo, config, status } = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        name,
        yunxiaoProjectId,
        feishuChatId,
        githubRepo,
        config,
        status
      }
    });

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/projects/:id - 删除项目
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.json({
      success: true,
      message: 'Project deleted'
    });
  } catch (error) {
    next(error);
  }
});

export default router;
