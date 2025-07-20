import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateProjectDto {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  color?: string;
  isArchived?: boolean;
}

export interface CreateBoardDto {
  name: string;
  description?: string;
}

export interface UpdateBoardDto {
  name?: string;
  description?: string;
  position?: number;
}

export class ProjectService {
  async createProject(userId: string, projectData: CreateProjectDto) {
    const { name, description, color } = projectData;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#4F46E5',
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        boards: true,
      },
    });

    return project;
  }

  async getUserProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
        isArchived: false,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        boards: {
          orderBy: {
            position: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return projects;
  }

  async getProjectById(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        boards: {
          include: {
            columns: {
              include: {
                tasks: {
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
                  },
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
              orderBy: {
                position: 'asc',
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    return project;
  }

  async updateProject(projectId: string, userId: string, updateData: UpdateProjectDto) {
    // Check if user has permission to update project
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        boards: true,
      },
    });

    return project;
  }

  async deleteProject(projectId: string, userId: string) {
    // Check if user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: userId,
      },
    });

    if (!project) {
      throw new Error('Project not found or access denied: only project owner can delete');
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return true;
  }

  async addProjectMember(projectId: string, userId: string, targetUserId: string, role: 'ADMIN' | 'MEMBER' | 'VIEWER' = 'MEMBER') {
    // Check if user has permission to add members
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    // Check if user is already a member
    const existingMembership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (existingMembership) {
      throw new Error('User is already a member of this project');
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId,
        userId: targetUserId,
        role,
      },
      include: {
        user: {
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

    return newMember;
  }

  async removeProjectMember(projectId: string, userId: string, targetUserId: string) {
    // Check if user has permission to remove members
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    // Cannot remove project owner
    const targetMembership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: targetUserId,
      },
    });

    if (!targetMembership) {
      throw new Error('User is not a member of this project');
    }

    if (targetMembership.role === 'OWNER') {
      throw new Error('Cannot remove project owner');
    }

    await prisma.projectMember.delete({
      where: {
        id: targetMembership.id,
      },
    });

    return true;
  }

  // Board Management
  async createBoard(projectId: string, userId: string, boardData: CreateBoardDto) {
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

    // Get next position
    const lastBoard = await prisma.board.findFirst({
      where: { projectId },
      orderBy: { position: 'desc' },
    });

    const position = lastBoard ? lastBoard.position + 1 : 0;

    const board = await prisma.board.create({
      data: {
        name: boardData.name,
        description: boardData.description,
        projectId,
        position,
        columns: {
          create: [
            { name: 'To Do', color: '#6B7280', position: 0 },
            { name: 'In Progress', color: '#F59E0B', position: 1 },
            { name: 'Done', color: '#10B981', position: 2 },
          ],
        },
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return board;
  }

  async getProjectBoards(projectId: string, userId: string) {
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

    const boards = await prisma.board.findMany({
      where: { projectId },
      include: {
        columns: {
          include: {
            tasks: {
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
              },
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
      orderBy: { position: 'asc' },
    });

    return boards;
  }

  async updateBoard(boardId: string, userId: string, updateData: UpdateBoardDto) {
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

    const updatedBoard = await prisma.board.update({
      where: { id: boardId },
      data: updateData,
      include: {
        columns: {
          orderBy: { position: 'asc' },
        },
      },
    });

    return updatedBoard;
  }

  async deleteBoard(boardId: string, userId: string) {
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
          in: ['OWNER', 'ADMIN'],
        },
      },
    });

    if (!membership) {
      throw new Error('Access denied: insufficient permissions');
    }

    await prisma.board.delete({
      where: { id: boardId },
    });

    return true;
  }
}

export const projectService = new ProjectService();