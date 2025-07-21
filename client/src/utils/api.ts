import {
  User,
  CreateUserDto,
  LoginDto,
  UpdateUserDto,
  ChangePasswordDto,
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  Board,
  CreateBoardDto,
  UpdateBoardDto,
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  Comment,
  CreateCommentDto,
  Attachment,
  TaskStatistics,
  ApiResponse,
  AuthResponse,
} from '../../../shared/types';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.origin.includes('netlify') 
    ? `${window.location.origin}/.netlify/functions/api`
    : 'http://localhost:3001/api'
);

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

const setToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

const removeToken = (): void => {
  localStorage.removeItem('auth_token');
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'An error occurred',
        response.status,
        data.errors
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred', 0);
  }
};

// Authentication API
export const authApi = {
  register: async (userData: CreateUserDto): Promise<AuthResponse> => {
    const response = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data?.token) {
      setToken(response.data.token);
    }
    
    return {
      success: response.success,
      message: response.message,
      user: response.data?.user,
      token: response.data?.token,
    };
  },

  login: async (credentials: LoginDto): Promise<AuthResponse> => {
    const response = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.data?.token) {
      setToken(response.data.token);
    }
    
    return {
      success: response.success,
      message: response.message,
      user: response.data?.user,
      token: response.data?.token,
    };
  },

  logout: async (): Promise<void> => {
    await request('/auth/logout', { method: 'POST' });
    removeToken();
  },

  getMe: async (): Promise<User> => {
    const response = await request<{ user: User }>('/auth/me');
    return response.data!.user;
  },

  updateProfile: async (updateData: UpdateUserDto): Promise<User> => {
    const response = await request<{ user: User }>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data!.user;
  },

  changePassword: async (passwordData: ChangePasswordDto): Promise<void> => {
    await request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData),
    });
  },

  deleteAccount: async (): Promise<void> => {
    await request('/auth/me', { method: 'DELETE' });
    removeToken();
  },
};

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const response = await request<Project[]>('/projects');
    return response.data!;
  },

  getById: async (id: string): Promise<Project> => {
    const response = await request<Project>(`/projects/${id}`);
    return response.data!;
  },

  create: async (projectData: CreateProjectDto): Promise<Project> => {
    const response = await request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
    return response.data!;
  },

  update: async (id: string, updateData: UpdateProjectDto): Promise<Project> => {
    const response = await request<Project>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/projects/${id}`, { method: 'DELETE' });
  },

  getBoards: async (id: string): Promise<Board[]> => {
    const response = await request<Board[]>(`/projects/${id}/boards`);
    return response.data!;
  },

  createBoard: async (id: string, boardData: CreateBoardDto): Promise<Board> => {
    const response = await request<Board>(`/projects/${id}/boards`, {
      method: 'POST',
      body: JSON.stringify(boardData),
    });
    return response.data!;
  },

  addMember: async (id: string, userId: string, role: string = 'MEMBER'): Promise<any> => {
    const response = await request(`/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
    return response.data!;
  },

  removeMember: async (id: string, memberId: string): Promise<void> => {
    await request(`/projects/${id}/members/${memberId}`, { method: 'DELETE' });
  },
};

// Boards API
export const boardsApi = {
  update: async (id: string, updateData: UpdateBoardDto): Promise<Board> => {
    const response = await request<Board>(`/boards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/boards/${id}`, { method: 'DELETE' });
  },

  createColumn: async (id: string, columnData: any): Promise<any> => {
    const response = await request(`/boards/${id}/columns`, {
      method: 'POST',
      body: JSON.stringify(columnData),
    });
    return response.data!;
  },
};

// Columns API
export const columnsApi = {
  update: async (id: string, updateData: any): Promise<any> => {
    const response = await request(`/columns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/columns/${id}`, { method: 'DELETE' });
  },

  reorder: async (boardId: string, columnIds: string[]): Promise<void> => {
    await request(`/columns/reorder/${boardId}`, {
      method: 'POST',
      body: JSON.stringify({ columnIds }),
    });
  },
};

// Tasks API
export const tasksApi = {
  getAll: async (filters: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    const response = await request<Task[]>(`/tasks?${params.toString()}`);
    return response.data!;
  },

  getById: async (id: string): Promise<Task> => {
    const response = await request<Task>(`/tasks/${id}`);
    return response.data!;
  },

  create: async (taskData: CreateTaskDto): Promise<Task> => {
    const response = await request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.data!;
  },

  update: async (id: string, updateData: UpdateTaskDto): Promise<Task> => {
    const response = await request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/tasks/${id}`, { method: 'DELETE' });
  },

  move: async (id: string, targetColumnId: string, targetPosition: number): Promise<void> => {
    await request(`/tasks/${id}/move`, {
      method: 'POST',
      body: JSON.stringify({ targetColumnId, targetPosition }),
    });
  },

  reorder: async (columnId: string, taskIds: string[]): Promise<void> => {
    await request(`/tasks/reorder/${columnId}`, {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    });
  },

  getComments: async (id: string): Promise<Comment[]> => {
    const response = await request<Comment[]>(`/tasks/${id}/comments`);
    return response.data!;
  },

  addComment: async (id: string, commentData: CreateCommentDto): Promise<Comment> => {
    const response = await request<Comment>(`/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
    return response.data!;
  },

  getStatistics: async (projectId: string): Promise<TaskStatistics> => {
    const response = await request<TaskStatistics>(`/tasks/stats/${projectId}`);
    return response.data!;
  },
};

// Comments API
export const commentsApi = {
  update: async (id: string, content: string): Promise<Comment> => {
    const response = await request<Comment>(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return response.data!;
  },

  delete: async (id: string): Promise<void> => {
    await request(`/comments/${id}`, { method: 'DELETE' });
  },
};

// Attachments API
export const attachmentsApi = {
  upload: async (taskId: string, file: File): Promise<Attachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attachments/${taskId}`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new ApiError(data.message || 'Upload failed', response.status);
    }

    return data.data;
  },

  getTaskAttachments: async (taskId: string): Promise<Attachment[]> => {
    const response = await request<Attachment[]>(`/attachments/task/${taskId}`);
    return response.data!;
  },

  download: async (id: string): Promise<void> => {
    const token = getToken();
    const response = await fetch(`${API_BASE_URL}/attachments/${id}/download`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new ApiError('Download failed', response.status);
    }

    const blob = await response.blob();
    const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'download';
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  delete: async (id: string): Promise<void> => {
    await request(`/attachments/${id}`, { method: 'DELETE' });
  },
};

export { ApiError, setToken, removeToken, getToken };