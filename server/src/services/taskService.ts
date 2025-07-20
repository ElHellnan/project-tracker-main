import { PrismaClient, Priority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  startDate?: string;
  assigneeId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueDate?: string;
  startDate?: string;
  assigneeId?: string;
  columnId?: string;
  position?: number;
}

export interface TaskFilters {
  assigneeId?: string;
  priority?: Priority;
  status?: TaskStatus;
  dueBefore?: string;
  dueAfter?: string;
  search?: string;
}

export class TaskService {
  async createTask(columnId: string, userId: string, taskData: CreateTaskDto) {
    // Check if user has access to column's project
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!column) {
      throw new Error('Column not found');
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: column.board.projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Check if assignee is a project member (if assignee specified)
    if (taskData.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findFirst({
        where: {
          projectId: column.board.projectId,
          userId: taskData.assigneeId,
        },
      });

      if (!assigneeMembership) {
        throw new Error('Assignee is not a member of this project');
      }
    }

    // Get next position
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { position: 'desc' },
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority || 'MEDIUM',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
        startDate: taskData.startDate ? new Date(taskData.startDate) : null,
        assigneeId: taskData.assigneeId,
        creatorId: userId,
        columnId,
        position,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        column: {
          include: {
            board: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
      },
    });

    return task;
  }

  async getTaskById(taskId: string, userId: string) {
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
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        column: {
          include: {
            board: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
        comments: {
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
        },
        attachments: {
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
        },
      },
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    return task;
  }

  async updateTask(taskId: string, userId: string, updateData: UpdateTaskDto) {
    // Get task with project access check
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            project: {
              members: {
                some: {
                  userId,
                  role: {
                    in: ['OWNER', 'ADMIN', 'MEMBER'],
                  },
                },
              },
            },
          },
        },
      },
      include: {
        column: {
          include: {
            board: {
              include: { project: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new Error('Task not found or access denied');
    }

    // Check if assignee is a project member (if assignee being changed)
    if (updateData.assigneeId) {
      const assigneeMembership = await prisma.projectMember.findFirst({
        where: {
          projectId: task.column.board.projectId,
          userId: updateData.assigneeId,
        },
      });

      if (!assigneeMembership) {
        throw new Error('Assignee is not a member of this project');
      }
    }

    // Handle column change
    if (updateData.columnId && updateData.columnId !== task.columnId) {
      const targetColumn = await prisma.column.findFirst({
        where: {
          id: updateData.columnId,
          board: {
            projectId: task.column.board.projectId,
          },
        },
      });

      if (!targetColumn) {
        throw new Error('Target column not found in the same project');
      }

      // Get next position in target column
      const lastTaskInColumn = await prisma.task.findFirst({
        where: { columnId: updateData.columnId },
        orderBy: { position: 'desc' },
      });

      updateData.position = lastTaskInColumn ? lastTaskInColumn.position + 1 : 0;
    }

    // Handle status change
    if (updateData.status === 'DONE' && task.status !== 'DONE') {
      updateData.completedAt = new Date();
    } else if (updateData.status !== 'DONE' && task.completedAt) {
      updateData.completedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...updateData,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : updateData.dueDate,
        startDate: updateData.startDate ? new Date(updateData.startDate) : updateData.startDate,
        completedAt: updateData.completedAt,
      },
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        column: {
          include: {
            board: {
              select: {
                id: true,
                name: true,
                projectId: true,
              },
            },
          },
        },
      },
    });

    return updatedTask;
  }

  async deleteTask(taskId: string, userId: string) {
    // Get task with project access check
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        column: {
          board: {
            project: {
              members: {
                some: {
                  userId,
                  role: {
                    in: ['OWNER', 'ADMIN', 'MEMBER'],
                  },
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

    await prisma.task.delete({
      where: { id: taskId },
    });

    return true;
  }

  async getProjectTasks(projectId: string, userId: string, filters?: TaskFilters) {
    // Check if user has access to project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      throw new Error('Access denied: not a project member');
    }

    let whereClause: any = {
      column: {
        board: {
          projectId,
        },
      },
    };

    // Apply filters
    if (filters) {
      if (filters.assigneeId) {
        whereClause.assigneeId = filters.assigneeId;
      }
      if (filters.priority) {
        whereClause.priority = filters.priority;
      }
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.dueBefore || filters.dueAfter) {
        whereClause.dueDate = {};
        if (filters.dueBefore) {
          whereClause.dueDate.lte = new Date(filters.dueBefore);
        }
        if (filters.dueAfter) {
          whereClause.dueDate.gte = new Date(filters.dueAfter);
        }
      }
      if (filters.search) {
        whereClause.OR = [
          {
            title: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        ];
      }
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        column: {
          select: {
            id: true,
            name: true,
            board: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { column: { position: 'asc' } },
        { position: 'asc' },
      ],
    });

    return tasks;
  }

  async moveTask(taskId: string, userId: string, targetColumnId: string, targetPosition: number) {
    const task = await this.getTaskById(taskId, userId);
    
    // Update task position and column
    await this.updateTask(taskId, userId, {
      columnId: targetColumnId,
      position: targetPosition,
    });

    return true;
  }

  async reorderTasks(columnId: string, userId: string, taskIds: string[]) {
    // Check if user has access to column's project
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { project: true },
        },
      },
    });

    if (!column) {
      throw new Error('Column not found');
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: column.board.projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Update positions
    const updatePromises = taskIds.map((taskId, index) =>
      prisma.task.update({
        where: { id: taskId },
        data: { position: index },
      })
    );

    await Promise.all(updatePromises);

    return true;
  }

  async getTaskStatistics(projectId: string, userId: string) {
    // Check if user has access to project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!membership) {
      throw new Error('Access denied: not a project member');
    }

    const stats = await prisma.task.groupBy({
      by: ['status'],
      where: {
        column: {
          board: {
            projectId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    const priorityStats = await prisma.task.groupBy({
      by: ['priority'],
      where: {
        column: {
          board: {
            projectId,
          },
        },
      },
      _count: {
        id: true,
      },
    });

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityStats.reduce((acc, stat) => {
        acc[stat.priority] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const taskService = new TaskService();