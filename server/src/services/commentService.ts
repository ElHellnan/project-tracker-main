import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CommentService {
  async createComment(taskId: string, userId: string, content: string) {
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

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        authorId: userId,
      },
      include: {
        author: {
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

    return comment;
  }

  async getTaskComments(taskId: string, userId: string) {
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
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
        createdAt: 'asc',
      },
    });

    return comments;
  }

  async updateComment(commentId: string, userId: string, content: string) {
    // Check if user is the author of the comment
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        authorId: userId,
      },
    });

    if (!comment) {
      throw new Error('Comment not found or access denied');
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content,
        edited: true,
      },
      include: {
        author: {
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

    return updatedComment;
  }

  async deleteComment(commentId: string, userId: string) {
    // Check if user is the author of the comment or has admin permissions
    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
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

    if (!comment) {
      throw new Error('Comment not found');
    }

    const membership = comment.task.column.board.project.members[0];
    const canDelete = comment.authorId === userId || 
                      (membership && ['OWNER', 'ADMIN'].includes(membership.role));

    if (!canDelete) {
      throw new Error('Access denied: insufficient permissions');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return true;
  }
}

export const commentService = new CommentService();