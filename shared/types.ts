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

export interface CreateUserDto {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UpdateUserDto {
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
}

// Project Management Types
export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: User;
  members: ProjectMember[];
  boards: Board[];
}

export interface ProjectMember {
  id: string;
  role: Role;
  userId: string;
  projectId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

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

export interface Board {
  id: string;
  name: string;
  description?: string;
  position: number;
  projectId: string;
  project?: Project;
  columns: Column[];
  createdAt: string;
  updatedAt: string;
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

export interface Column {
  id: string;
  name: string;
  color: string;
  position: number;
  limit?: number;
  boardId: string;
  board?: Board;
  tasks: Task[];
  createdAt: string;
  updatedAt: string;
}

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
  column: Column;
  assigneeId?: string;
  assignee?: User;
  creatorId: string;
  creator: User;
  comments: Comment[];
  attachments: Attachment[];
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: string;
  startDate?: string;
  assigneeId?: string;
  columnId: string;
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
  projectId?: string;
}

export interface Comment {
  id: string;
  content: string;
  edited: boolean;
  taskId: string;
  authorId: string;
  author: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  taskId: string;
  uploadedById: string;
  uploadedBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStatistics {
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
}

export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}