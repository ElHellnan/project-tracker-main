import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { projectService } from '../services/projectService.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isArchived: z.boolean().optional(),
});

const createBoardSchema = z.object({
  name: z.string().min(1, 'Board name is required').max(100, 'Board name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']).default('MEMBER'),
});

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/projects
router.get('/', asyncHandler(async (req, res) => {
  try {
    const projects = await projectService.getUserProjects(req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve projects',
    });
  }
}));

// POST /api/projects
router.post('/', asyncHandler(async (req, res) => {
  try {
    createProjectSchema.parse(req.body);
    const project = await projectService.createProject(req.user!.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors,
      });
    }
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create project',
    });
  }
}));

// GET /api/projects/:id
router.get('/:id', asyncHandler(async (req, res) => {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Project retrieved successfully',
      data: project,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('not found') ? 404 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve project',
    });
  }
}));

// PUT /api/projects/:id
router.put('/:id', asyncHandler(async (req, res) => {
  try {
    updateProjectSchema.parse(req.body);
    const project = await projectService.updateProject(req.params.id, req.user!.id, req.body);
    
    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: project,
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
      message: error instanceof Error ? error.message : 'Failed to update project',
    });
  }
}));

// DELETE /api/projects/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await projectService.deleteProject(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete project',
    });
  }
}));

// GET /api/projects/:id/boards
router.get('/:id/boards', asyncHandler(async (req, res) => {
  try {
    const boards = await projectService.getProjectBoards(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Project boards retrieved successfully',
      data: boards,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve boards',
    });
  }
}));

// POST /api/projects/:id/boards
router.post('/:id/boards', asyncHandler(async (req, res) => {
  try {
    createBoardSchema.parse(req.body);
    const board = await projectService.createBoard(req.params.id, req.user!.id, req.body);
    
    res.status(201).json({
      success: true,
      message: 'Board created successfully',
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
      message: error instanceof Error ? error.message : 'Failed to create board',
    });
  }
}));

// POST /api/projects/:id/members
router.post('/:id/members', asyncHandler(async (req, res) => {
  try {
    addMemberSchema.parse(req.body);
    const member = await projectService.addProjectMember(req.params.id, req.user!.id, req.body.userId, req.body.role);
    
    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: member,
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
      message: error instanceof Error ? error.message : 'Failed to add member',
    });
  }
}));

// DELETE /api/projects/:id/members/:memberId
router.delete('/:id/members/:memberId', asyncHandler(async (req, res) => {
  try {
    await projectService.removeProjectMember(req.params.id, req.user!.id, req.params.memberId);
    
    res.status(200).json({
      success: true,
      message: 'Member removed successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to remove member',
    });
  }
}));

export default router;