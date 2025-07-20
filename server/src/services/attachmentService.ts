import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export class AttachmentService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async uploadAttachment(taskId: string, userId: string, file: UploadedFile) {
    // Check if user has access to task's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            project: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadsDir, uniqueFilename);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create attachment record
    const attachment = await prisma.attachment.create({
      data: {
        filename: uniqueFilename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: filePath,
        taskId,
        uploadedById: userId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return attachment;
  }

  async getTaskAttachments(taskId: string, userId: string) {
    // Check if user has access to task's project
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            project: {
              members: {
                some: {
                  userId,
                },
              },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    const attachments = await prisma.attachment.findMany({
      where: { taskId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return attachments;
  }

  async downloadAttachment(attachmentId: string, userId: string) {
    // Check if user has access to attachment's task project
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
        task: {
          column: {
            board: {
              project: {
                members: {
                  some: {
                    userId,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new Error('Attachment not found or access denied');
    }

    try {
      const fileBuffer = await fs.readFile(attachment.path);
      return {
        buffer: fileBuffer,
        filename: attachment.originalName,
        mimetype: attachment.mimeType,
      };
    } catch (error) {
      throw new Error('File not found on disk');
    }
  }

  async deleteAttachment(attachmentId: string, userId: string) {
    // Check if user has access to attachment and permissions
    const attachment = await prisma.attachment.findFirst({
      where: {
        id: attachmentId,
      },
      include: {
        task: {
          include: {
            column: {
              include: {
                board: {
                  include: {
                    project: {
                      include: {
                        members: {
                          where: {
                            userId,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attachment) {
      throw new Error('Attachment not found');
    }

    const membership = attachment.task.column.board.project.members[0];
    const canDelete = attachment.uploadedById === userId || 
                      (membership && ['OWNER', 'ADMIN'].includes(membership.role));

    if (!canDelete) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Delete file from disk
    try {
      await fs.unlink(attachment.path);
    } catch (error) {
      // File might already be deleted, continue with database cleanup
    }

    // Delete attachment record
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });

    return true;
  }
}

export const attachmentService = new AttachmentService();