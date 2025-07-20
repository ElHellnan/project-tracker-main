import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Task, 
  CreateTaskDto, 
  UpdateTaskDto,
  TaskFilters,
  Comment,
  CreateCommentDto,
  Attachment
} from '../../../shared/types';
import { tasksApi, commentsApi, attachmentsApi, columnsApi } from '../utils/api';

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  comments: Comment[];
  attachments: Attachment[];
  isLoading: boolean;
  error: string | null;
  
  // Task actions
  fetchTasks: (filters: TaskFilters) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (taskData: CreateTaskDto) => Promise<void>;
  updateTask: (id: string, taskData: UpdateTaskDto) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (id: string, targetColumnId: string, targetPosition: number) => Promise<void>;
  reorderTasks: (columnId: string, taskIds: string[]) => Promise<void>;
  
  // Comment actions
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, commentData: CreateCommentDto) => Promise<void>;
  updateComment: (id: string, content: string) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;
  
  // Attachment actions
  fetchAttachments: (taskId: string) => Promise<void>;
  uploadAttachment: (taskId: string, file: File) => Promise<void>;
  downloadAttachment: (id: string) => Promise<void>;
  deleteAttachment: (id: string) => Promise<void>;
  
  // State setters
  setCurrentTask: (task: Task | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools((set, get) => ({
    // Initial state
    tasks: [],
    currentTask: null,
    comments: [],
    attachments: [],
    isLoading: false,
    error: null,

    // Task actions
    fetchTasks: async (filters: TaskFilters) => {
      set({ isLoading: true, error: null });
      try {
        const tasks = await tasksApi.getAll(filters);
        set({ tasks, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch tasks', 
          isLoading: false 
        });
      }
    },

    fetchTask: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const task = await tasksApi.getById(id);
        set({ 
          currentTask: task,
          comments: task.comments || [],
          attachments: task.attachments || [],
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch task', 
          isLoading: false 
        });
      }
    },

    createTask: async (taskData: CreateTaskDto) => {
      set({ isLoading: true, error: null });
      try {
        const newTask = await tasksApi.create(taskData);
        set({ 
          tasks: [...get().tasks, newTask],
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to create task', 
          isLoading: false 
        });
        throw error;
      }
    },

    updateTask: async (id: string, taskData: UpdateTaskDto) => {
      set({ isLoading: true, error: null });
      try {
        const updatedTask = await tasksApi.update(id, taskData);
        const tasks = get().tasks.map(t => 
          t.id === id ? updatedTask : t
        );
        set({ 
          tasks,
          currentTask: get().currentTask?.id === id ? updatedTask : get().currentTask,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to update task', 
          isLoading: false 
        });
        throw error;
      }
    },

    deleteTask: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await tasksApi.delete(id);
        const tasks = get().tasks.filter(t => t.id !== id);
        set({ 
          tasks,
          currentTask: get().currentTask?.id === id ? null : get().currentTask,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to delete task', 
          isLoading: false 
        });
        throw error;
      }
    },

    moveTask: async (id: string, targetColumnId: string, targetPosition: number) => {
      set({ isLoading: true, error: null });
      try {
        await tasksApi.move(id, targetColumnId, targetPosition);
        
        // Update task in local state
        const tasks = get().tasks.map(t => 
          t.id === id 
            ? { ...t, columnId: targetColumnId, position: targetPosition }
            : t
        );
        set({ tasks, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to move task', 
          isLoading: false 
        });
        throw error;
      }
    },

    reorderTasks: async (columnId: string, taskIds: string[]) => {
      set({ isLoading: true, error: null });
      try {
        await tasksApi.reorder(columnId, taskIds);
        
        // Update task positions in local state
        const tasks = get().tasks.map(t => {
          const newPosition = taskIds.indexOf(t.id);
          return newPosition >= 0 ? { ...t, position: newPosition } : t;
        });
        set({ tasks, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to reorder tasks', 
          isLoading: false 
        });
        throw error;
      }
    },

    // Comment actions
    fetchComments: async (taskId: string) => {
      set({ isLoading: true, error: null });
      try {
        const comments = await tasksApi.getComments(taskId);
        set({ comments, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch comments', 
          isLoading: false 
        });
      }
    },

    addComment: async (taskId: string, commentData: CreateCommentDto) => {
      set({ isLoading: true, error: null });
      try {
        const newComment = await tasksApi.addComment(taskId, commentData);
        set({ 
          comments: [...get().comments, newComment],
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to add comment', 
          isLoading: false 
        });
        throw error;
      }
    },

    updateComment: async (id: string, content: string) => {
      set({ isLoading: true, error: null });
      try {
        const updatedComment = await commentsApi.update(id, content);
        const comments = get().comments.map(c => 
          c.id === id ? updatedComment : c
        );
        set({ comments, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to update comment', 
          isLoading: false 
        });
        throw error;
      }
    },

    deleteComment: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await commentsApi.delete(id);
        const comments = get().comments.filter(c => c.id !== id);
        set({ comments, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to delete comment', 
          isLoading: false 
        });
        throw error;
      }
    },

    // Attachment actions
    fetchAttachments: async (taskId: string) => {
      set({ isLoading: true, error: null });
      try {
        const attachments = await attachmentsApi.getTaskAttachments(taskId);
        set({ attachments, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch attachments', 
          isLoading: false 
        });
      }
    },

    uploadAttachment: async (taskId: string, file: File) => {
      set({ isLoading: true, error: null });
      try {
        const newAttachment = await attachmentsApi.upload(taskId, file);
        set({ 
          attachments: [...get().attachments, newAttachment],
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to upload attachment', 
          isLoading: false 
        });
        throw error;
      }
    },

    downloadAttachment: async (id: string) => {
      try {
        await attachmentsApi.download(id);
      } catch (error: any) {
        set({ error: error.message || 'Failed to download attachment' });
        throw error;
      }
    },

    deleteAttachment: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await attachmentsApi.delete(id);
        const attachments = get().attachments.filter(a => a.id !== id);
        set({ attachments, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to delete attachment', 
          isLoading: false 
        });
        throw error;
      }
    },

    // State setters
    setCurrentTask: (task: Task | null) => {
      set({ 
        currentTask: task,
        comments: task?.comments || [],
        attachments: task?.attachments || []
      });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);