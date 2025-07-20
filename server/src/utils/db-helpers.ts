import prisma from './database.js';
import { Prisma } from '@prisma/client';

// User helpers
export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
      bio: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

// Project helpers
export const findProjectsByUserId = async (userId: string) => {
  return await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
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
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          boards: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
};

export const findProjectById = async (id: string, userId: string) => {
  return await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
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
                  _count: {
                    select: {
                      comments: true,
                      attachments: true,
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
};

// Task helpers
export const findTasksByUserId = async (userId: string) => {
  return await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { creatorId: userId },
      ],
    },
    include: {
      column: {
        include: {
          board: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      },
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
      _count: {
        select: {
          comments: true,
          attachments: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
};

export const findTaskById = async (id: string) => {
  return await prisma.task.findUnique({
    where: { id },
    include: {
      column: {
        include: {
          board: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
        },
      },
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
};

// Error handling helper
export const handlePrismaError = (error: any) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return { message: 'A record with this value already exists', status: 409 };
      case 'P2025':
        return { message: 'Record not found', status: 404 };
      case 'P2003':
        return { message: 'Foreign key constraint failed', status: 400 };
      default:
        return { message: 'Database error occurred', status: 500 };
    }
  }
  return { message: 'Internal server error', status: 500 };
};