import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import projectRoutes from './routes/projects';
import demandRoutes from './routes/demands';
import bugRoutes from './routes/bugs';
import dashboardRoutes from './routes/dashboard';
import syncRoutes from './routes/sync';
import yunxiaoRoutes from './routes/yunxiao';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import cronService from './services/cronService';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/demands', demandRoutes);
app.use('/api/bugs', bugRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/yunxiao', yunxiaoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`AICTO API server running on port ${PORT}`);
  
  // 启动定时任务
  cronService.startCronJobs();
});

export default app;
