import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'john_doe',
      firstName: 'John',
      lastName: 'Doe',
      password: hashedPassword,
      bio: 'Project manager and tech enthusiast',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'jane_smith',
      firstName: 'Jane',
      lastName: 'Smith',
      password: hashedPassword,
      bio: 'Full-stack developer',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob_wilson',
      firstName: 'Bob',
      lastName: 'Wilson',
      password: hashedPassword,
      bio: 'UI/UX designer',
    },
  });

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: 'project1' },
    update: {},
    create: {
      id: 'project1',
      name: 'Website Redesign',
      description: 'Complete redesign of the company website',
      color: '#3B82F6',
      ownerId: user1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'project2' },
    update: {},
    create: {
      id: 'project2',
      name: 'Mobile App Development',
      description: 'Build a new mobile application',
      color: '#10B981',
      ownerId: user1.id,
    },
  });

  // Create project members
  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: user2.id, projectId: project1.id } },
    update: {},
    create: {
      userId: user2.id,
      projectId: project1.id,
      role: 'MEMBER',
    },
  });

  await prisma.projectMember.upsert({
    where: { userId_projectId: { userId: user3.id, projectId: project1.id } },
    update: {},
    create: {
      userId: user3.id,
      projectId: project1.id,
      role: 'MEMBER',
    },
  });

  // Create boards
  const board1 = await prisma.board.upsert({
    where: { id: 'board1' },
    update: {},
    create: {
      id: 'board1',
      name: 'Main Board',
      description: 'Primary project board',
      projectId: project1.id,
      position: 0,
    },
  });

  const board2 = await prisma.board.upsert({
    where: { id: 'board2' },
    update: {},
    create: {
      id: 'board2',
      name: 'Development Board',
      description: 'Development tasks and features',
      projectId: project2.id,
      position: 0,
    },
  });

  // Create columns
  const column1 = await prisma.column.upsert({
    where: { id: 'column1' },
    update: {},
    create: {
      id: 'column1',
      name: 'To Do',
      color: '#6B7280',
      position: 0,
      boardId: board1.id,
    },
  });

  const column2 = await prisma.column.upsert({
    where: { id: 'column2' },
    update: {},
    create: {
      id: 'column2',
      name: 'In Progress',
      color: '#3B82F6',
      position: 1,
      boardId: board1.id,
    },
  });

  const column3 = await prisma.column.upsert({
    where: { id: 'column3' },
    update: {},
    create: {
      id: 'column3',
      name: 'Review',
      color: '#F59E0B',
      position: 2,
      boardId: board1.id,
    },
  });

  const column4 = await prisma.column.upsert({
    where: { id: 'column4' },
    update: {},
    create: {
      id: 'column4',
      name: 'Done',
      color: '#10B981',
      position: 3,
      boardId: board1.id,
    },
  });

  // Create tasks
  await prisma.task.upsert({
    where: { id: 'task1' },
    update: {},
    create: {
      id: 'task1',
      title: 'Design homepage mockups',
      description: 'Create wireframes and mockups for the new homepage design',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      position: 0,
      dueDate: new Date('2024-02-15'),
      columnId: column2.id,
      assigneeId: user3.id,
      creatorId: user1.id,
    },
  });

  await prisma.task.upsert({
    where: { id: 'task2' },
    update: {},
    create: {
      id: 'task2',
      title: 'Set up development environment',
      description: 'Configure development tools and dependencies',
      priority: 'MEDIUM',
      status: 'DONE',
      position: 0,
      completedAt: new Date(),
      columnId: column4.id,
      assigneeId: user2.id,
      creatorId: user1.id,
    },
  });

  await prisma.task.upsert({
    where: { id: 'task3' },
    update: {},
    create: {
      id: 'task3',
      title: 'Research user requirements',
      description: 'Conduct user interviews and gather requirements',
      priority: 'HIGH',
      status: 'TODO',
      position: 0,
      dueDate: new Date('2024-02-10'),
      columnId: column1.id,
      assigneeId: user1.id,
      creatorId: user1.id,
    },
  });

  await prisma.task.upsert({
    where: { id: 'task4' },
    update: {},
    create: {
      id: 'task4',
      title: 'Implement authentication system',
      description: 'Build user registration and login functionality',
      priority: 'HIGH',
      status: 'REVIEW',
      position: 0,
      columnId: column3.id,
      assigneeId: user2.id,
      creatorId: user1.id,
    },
  });

  // Create comments
  await prisma.comment.upsert({
    where: { id: 'comment1' },
    update: {},
    create: {
      id: 'comment1',
      content: 'Great progress on the mockups! The layout looks clean and modern.',
      taskId: 'task1',
      authorId: user1.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment2' },
    update: {},
    create: {
      id: 'comment2',
      content: 'Thanks! I\'ll have the final version ready by tomorrow.',
      taskId: 'task1',
      authorId: user3.id,
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment3' },
    update: {},
    create: {
      id: 'comment3',
      content: 'The authentication system is ready for review. All tests are passing.',
      taskId: 'task4',
      authorId: user2.id,
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log(`👤 Created ${await prisma.user.count()} users`);
  console.log(`📋 Created ${await prisma.project.count()} projects`);
  console.log(`🎯 Created ${await prisma.board.count()} boards`);
  console.log(`📊 Created ${await prisma.column.count()} columns`);
  console.log(`✅ Created ${await prisma.task.count()} tasks`);
  console.log(`💬 Created ${await prisma.comment.count()} comments`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });