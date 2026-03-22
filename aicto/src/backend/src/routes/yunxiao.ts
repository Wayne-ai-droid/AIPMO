import { Router } from 'express';
import { getProjects, getProjectDetail, getIterations } from '../services/yunxiaoService';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/yunxiao/projects - 从云效获取项目列表
router.get('/projects', async (req, res, next) => {
  try {
    logger.info('Fetching projects from Yunxiao...');
    const projects = await getProjects();
    
    // 为每个项目获取额外的统计信息（迭代数、成员数等）
    const projectsWithStats = await Promise.all(
      projects.map(async (project: any) => {
        try {
          // 获取项目迭代列表
          const iterations = await getIterations(project.id);
          
          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status || 'active',
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            // 统计信息
            iterationCount: iterations.length,
            memberCount: project.memberCount || 0,
            // 健康度（可以根据实际需求计算）
            healthScore: project.healthScore || 80,
          };
        } catch (error) {
          logger.warn(`Failed to get stats for project ${project.id}:`, error);
          return {
            id: project.id,
            name: project.name,
            description: project.description || '',
            status: project.status || 'active',
            iterationCount: 0,
            memberCount: 0,
            healthScore: 80,
          };
        }
      })
    );

    res.json({
      success: true,
      data: projectsWithStats
    });
  } catch (error) {
    logger.error('Failed to fetch projects from Yunxiao:', error);
    next(error);
  }
});

// GET /api/yunxiao/projects/:id - 从云效获取项目详情
router.get('/projects/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    logger.info(`Fetching project ${id} from Yunxiao...`);
    
    const [projectDetail, iterations] = await Promise.all([
      getProjectDetail(id),
      getIterations(id)
    ]);

    res.json({
      success: true,
      data: {
        ...projectDetail,
        iterations,
      }
    });
  } catch (error) {
    logger.error(`Failed to fetch project ${id} from Yunxiao:`, error);
    next(error);
  }
});

export default router;
