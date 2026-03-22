import { Router } from 'express';
import { prisma } from '../index';

const router = Router();

// GET /api/demands?projectId=xxx - 获取需求列表
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, assignee } = req.query;
    
    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId as string);
    if (status) where.status = status;
    if (assignee) where.assignee = assignee;

    const demands = await prisma.demand.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      success: true,
      data: demands,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/demands/:id - 获取需求详情
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const demand = await prisma.demand.findUnique({
      where: { id: parseInt(id) },
    });

    if (!demand) {
      return res.status(404).json({ error: 'Demand not found' });
    }

    res.json({
      success: true,
      data: demand,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
