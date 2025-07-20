export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  owner: User;
  ownerId: string;
  members: ProjectMember[];
  boards: Board[];
  _count?: {
    boards: number;
  };
}

export interface ProjectMember {
  id: string;
  role: Role;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  position: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  columns: Column[];
}

export interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  limit?: number;
  boardId: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: TaskStatus;
  position: number;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  columnId: string;
  assigneeId?: string;
  creatorId: string;
  column: Column;
  assignee?: User;
  creator: User;
  comments?: Comment[];
  attachments?: Attachment[];
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  authorId: string;
  author: User;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
  updatedAt: string;
  taskId: string;
  uploadedById: string;
  uploadedBy: User;
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
}

export interface ProjectForm {
  name: string;
  description?: string;
  color?: string;
}

export interface TaskForm {
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string;
  assigneeId?: string;
  columnId: string;
}

export interface CommentForm {
  content: string;
}