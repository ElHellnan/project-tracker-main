import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { columnService } from '../services/columnService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateColumnSchema = z.object({
  name: z.string().min(1, 'Column name is required').max(50, 'Column name too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  limit: z.number().int().min(1).optional(),
  position: z.number().int().min(0).optional(),
});

const reorderColumnsSchema = z.object({
  columnIds: z.array(z.string()).min(1, 'At least one column ID required'),
});

// Apply authentication to all routes
router.use(authenticateToken);

// PUT /api/columns/:id
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    updateColumnSchema.parse(req.body);
    const column = await columnService.updateColumn(req.params.id, req.user!.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Column updated successfully',
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
      message: error instanceof Error ? error.message : 'Failed to update column',
    });
  }
}));

// DELETE /api/columns/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await columnService.deleteColumn(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Column deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete column',
    });
  }
}));

// POST /api/columns/reorder/:boardId
router.post('/reorder/:boardId', asyncHandler(async (req, res) => {
  try {
    reorderColumnsSchema.parse(req.body);
    await columnService.reorderColumns(req.params.boardId, req.user!.id, req.body.columnIds);
    
    res.status(200).json({
      success: true,
      message: 'Columns reordered successfully',
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
      message: error instanceof Error ? error.message : 'Failed to reorder columns',
    });
  }
}));

export default router;