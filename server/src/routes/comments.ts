import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { commentService } from '../services/commentService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(1000, 'Comment too long'),
});

// Apply authentication to all routes
router.use(authenticateToken);

// PUT /api/comments/:id
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    updateCommentSchema.parse(req.body);
    const comment = await commentService.updateComment(req.params.id, req.user!.id, req.body.content);
    
    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
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
      message: error instanceof Error ? error.message : 'Failed to update comment',
    });
  }
}));

// DELETE /api/comments/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await commentService.deleteComment(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete comment',
    });
  }
}));

export default router;