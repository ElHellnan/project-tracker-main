import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { projectService } from '../services/projectService.js';
import { columnService } from '../services/columnService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100, 'Board name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  position: z.number().int().min(0).optional(),
});

const createColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50, 'Column name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  limit: z.number().int().min(1).optional(),
});

// Apply authentication to all routes
router.use(authenticateToken);

// PUT /api/boards/:id
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    updateBoardSchema.parse(req.body);
    const board = await projectService.updateBoard(req.params.id, req.user!.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Board updated successfully',
      data: board,
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
      message: error instanceof Error ? error.message : 'Failed to update board',
    });
  }
}));

// DELETE /api/boards/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await projectService.deleteBoard(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete board',
    });
  }
}));

// POST /api/boards/:id/columns
router.post('/:id/columns', asyncHandler(async (req, res) => {
  try {
    createColumnSchema.parse(req.body);
    const column = await columnService.createColumn(req.params.id, req.user!.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: column,
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
      message: error instanceof Error ? error.message : 'Failed to create column',
    });
  }
}));

export default router;