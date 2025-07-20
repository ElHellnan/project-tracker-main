import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { attachmentService } from '../services/attachmentService.js';
import multer from 'multer';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/x-zip-compressed',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/attachments/:taskId
router.post('/:taskId', upload.single('file'), asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    const attachment = await attachmentService.uploadAttachment(
      req.params.taskId,
      req.user!.id,
      {
        filename: req.file.filename || req.file.originalname!,
        originalname: req.file.originalname!,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      }
    );
    
    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: attachment,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to upload file',
    });
  }
}));

// GET /api/attachments/task/:taskId
router.get('/task/:taskId', asyncHandler(async (req, res) => {
  try {
    const attachments = await attachmentService.getTaskAttachments(req.params.taskId, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Attachments retrieved successfully',
      data: attachments,
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve attachments',
    });
  }
}));

// GET /api/attachments/:id/download
router.get('/:id/download', asyncHandler(async (req, res) => {
  try {
    const file = await attachmentService.downloadAttachment(req.params.id, req.user!.id);
    
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.setHeader('Content-Type', file.mimetype);
    res.send(file.buffer);
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 404;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to download file',
    });
  }
}));

// DELETE /api/attachments/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  try {
    await attachmentService.deleteAttachment(req.params.id, req.user!.id);
    
    res.status(200).json({
      success: true,
      message: 'Attachment deleted successfully',
    });
  } catch (error) {
    const status = error instanceof Error && error.message.includes('Access denied') ? 403 : 400;
    res.status(status).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete attachment',
    });
  }
}));

export default router;