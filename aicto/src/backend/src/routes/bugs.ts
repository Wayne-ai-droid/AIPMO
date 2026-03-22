import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/bugs?projectId=xxx - 获取缺陷列表
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, severity, assignee } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId as string);
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (assignee) where.assignee = assignee;

    const bugs = await prisma.bug.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: bugs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bugs/stats - 获取缺陷统计
router.get('/stats', async (req, res, next) => {
  try {
    const { projectId } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId as string);

    const [total, byStatus, bySeverity] = await Promise.all([
      prisma.bug.count({ where }),
      prisma.bug.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.bug.groupBy({
        by: ['severity'],
        where,
        _count: { id: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        bySeverity,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bugs/:id - 获取缺陷详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const bug = await prisma.bug.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bug) {
      return res.status(404).json({ error: 'Bug not found' });
    }

    res.json({
      success: true,
      data: bug,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
