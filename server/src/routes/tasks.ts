import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { taskService } from '../services/taskService.js';
import { commentService } from '../services/commentService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  columnId: z.string().min(1, 'Column ID is required'),
});

const updateTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long').optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  assigneeId: z.string().optional(),
  columnId: z.string().optional(),
  position: z.number().int().min(0).optional(),
});

const moveTaskSchema = z.object({
  targetColumnId: z.string().min(1, 'Target column ID is required'),
  targetPosition: z.number().int().min(0, 'Position must be non-negative'),
});

const reorderTasksSchema = z.object({
  taskIds: z.array(z.string()).min(1, 'At least one task ID required'),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

const taskFiltersSchema = z.object({
  assigneeId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']).optional(),
  dueBefore: z.string().datetime().optional(),
  dueAfter: z.string().datetime().optional(),
  search: z.string().optional(),
  projectId: z.string().optional(),
});

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/tasks
router.get('/', asyncHandler(async (req, res) => {
  try {
    const filters = taskFiltersSchema.parse(req.query);
    
    if (!filters.projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID is required',
      });
    }

    const tasks = await taskService.getProjectTasks(filters.projectId, req.user!.id, filters);
    
    res.status(200).json({
      success: true,
      message: 'Tasks retrieved successfully',
      data: tasks,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve tasks',
    });
  }
}));

// POST /api/tasks
router.post('/', asyncHandler(async (req, res) => {
  try {
    createTaskSchema.parse(req.body);
    const { columnId, ...taskData } = req.body;
    const task = await taskService.createTask(columnId, req.user!.id, taskData);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create task',
    });
  }
}));

// GET /api/tasks/:id
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Task retrieved successfully',
      data: task,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve task',
    });
  }
}));

// PUT /api/tasks/:id
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    updateTaskSchema.parse(req.body);
    const task = await taskService.updateTask(req.params.id, req.user!.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update task',
    });
  }
}));

// DELETE /api/tasks/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await taskService.deleteTask(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete task',
    });
  }
}));

// POST /api/tasks/:id/move
router.post('/:id/move', asyncHandler(async (req, res) => {
  try {
    moveTaskSchema.parse(req.body);
    await taskService.moveTask(req.params.id, req.user!.id, req.body.targetColumnId, req.body.targetPosition);
    
    res.status(200).json({
      success: true,
      message: 'Task moved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to move task',
    });
  }
}));

// POST /api/tasks/reorder/:columnId
router.post('/reorder/:columnId', asyncHandler(async (req, res) => {
  try {
    reorderTasksSchema.parse(req.body);
    await taskService.reorderTasks(req.params.columnId, req.user!.id, req.body.taskIds);
    
    res.status(200).json({
      success: true,
      message: 'Tasks reordered successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to reorder tasks',
    });
  }
}));

// GET /api/tasks/:id/comments
router.get('/:id/comments', asyncHandler(async (req, res) => {
  try {
    const comments = await commentService.getTaskComments(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve comments',
    });
  }
}));

// POST /api/tasks/:id/comments
router.post('/:id/comments', asyncHandler(async (req, res) => {
  try {
    createCommentSchema.parse(req.body);
    const comment = await commentService.createComment(req.params.id, req.user!.id, req.body.content);
    
    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: comment,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create comment',
    });
  }
}));

// GET /api/tasks/stats/:projectId
router.get('/stats/:projectId', asyncHandler(async (req, res) => {
  try {
    const stats = await taskService.getTaskStatistics(req.params.projectId, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Task statistics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve statistics',
    });
  }
}));

export default router;