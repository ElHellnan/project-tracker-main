import { Router } from 'express';
import { checkDatabaseHealth } from '../utils/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbHealth,
    version: process.env.npm_package_version || '1.0.0',
  };

  const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    data: health,
  });
}));

// Detailed health check
router.get('/detailed', asyncHandler(async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  
  const health = {
    status: dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbHealth,
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    pid: process.pid,
  };

  const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    data: health,
  });
}));

export default router;