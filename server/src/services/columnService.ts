import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateColumnDto {
  name: string;
  color?: string;
  limit?: number;
}

export interface UpdateColumnDto {
  name?: string;
  color?: string;
  limit?: number;
  position?: number;
}

export class ColumnService {
  async createColumn(boardId: string, userId: string, columnData: CreateColumnDto) {
    // Check if user has access to board's project
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { project: true },
    });

    if (!board) {
      throw new Error('Board not found');
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: board.projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN', 'MEMBER'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Get next position
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { position: 'desc' },
    });

    const position = lastColumn ? lastColumn.position + 1 : 0;

    const column = await prisma.column.create({
      data: {
        name: columnData.name,
        color: columnData.color || '#6B7280',
        limit: columnData.limit,
        boardId,
        position,
      },
    });

    return column;
  }

  async updateColumn(columnId: string, userId: string, updateData: UpdateColumnDto) {
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

    const updatedColumn = await prisma.column.update({
      where: { id: columnId },
      data: updateData,
    });

    return updatedColumn;
  }

  async deleteColumn(columnId: string, userId: string) {
    // Check if user has access to column's project
    const column = await prisma.column.findUnique({
      where: { id: columnId },
      include: {
        board: {
          include: { project: true },
        },
        tasks: true,
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
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Check if column has tasks
    if (column.tasks.length > 0) {
      throw new Error('Cannot delete column with tasks. Please move or delete tasks first.');
    }

    await prisma.column.delete({
      where: { id: columnId },
    });

    return true;
  }

  async reorderColumns(boardId: string, userId: string, columnIds: string[]) {
    // Check if user has access to board's project
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: { project: true },
    });

    if (!board) {
      throw new Error('Board not found');
    }

    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: board.projectId,
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
    const updatePromises = columnIds.map((columnId, index) =>
      prisma.column.update({
        where: { id: columnId },
        data: { position: index },
      })
    );

    await Promise.all(updatePromises);

    return true;
  }
}

export const columnService = new ColumnService();