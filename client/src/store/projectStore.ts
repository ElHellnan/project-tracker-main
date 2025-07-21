import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { 
  Project, 
  Board, 
 
  CreateProjectDto, 
  UpdateProjectDto,
  CreateBoardDto,
  UpdateBoardDto,
  TaskStatistics 
} from '../../../shared/types';
import { projectsApi, boardsApi, tasksApi } from '../utils/api';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  currentBoard: Board | null;
  statistics: TaskStatistics | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  createProject: (projectData: CreateProjectDto) => Promise<void>;
  updateProject: (id: string, projectData: UpdateProjectDto) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Board actions
  fetchBoards: (projectId: string) => Promise<void>;
  createBoard: (projectId: string, boardData: CreateBoardDto) => Promise<void>;
  updateBoard: (id: string, boardData: UpdateBoardDto) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  
  // Member actions
  addMember: (projectId: string, userId: string, role?: string) => Promise<void>;
  removeMember: (projectId: string, memberId: string) => Promise<void>;
  
  // Statistics
  fetchStatistics: (projectId: string) => Promise<void>;
  
  // State setters
  setCurrentProject: (project: Project | null) => void;
  setCurrentBoard: (board: Board | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(
  devtools((set, get) => ({
    // Initial state
    projects: [],
    currentProject: null,
    currentBoard: null,
    statistics: null,
    isLoading: false,
    error: null,

    // Project actions
    fetchProjects: async () => {
      set({ isLoading: true, error: null });
      try {
        const projects = await projectsApi.getAll();
        set({ projects, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch projects', 
          isLoading: false 
        });
      }
    },

    fetchProject: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        const project = await projectsApi.getById(id);
        set({ currentProject: project, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch project', 
          isLoading: false 
        });
      }
    },

    createProject: async (projectData: CreateProjectDto) => {
      set({ isLoading: true, error: null });
      try {
        const newProject = await projectsApi.create(projectData);
        set({ 
          projects: [...get().projects, newProject],
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to create project', 
          isLoading: false 
        });
        throw error;
      }
    },

    updateProject: async (id: string, projectData: UpdateProjectDto) => {
      set({ isLoading: true, error: null });
      try {
        const updatedProject = await projectsApi.update(id, projectData);
        const projects = get().projects.map(p => 
          p.id === id ? updatedProject : p
        );
        set({ 
          projects,
          currentProject: get().currentProject?.id === id ? updatedProject : get().currentProject,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to update project', 
          isLoading: false 
        });
        throw error;
      }
    },

    deleteProject: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await projectsApi.delete(id);
        const projects = get().projects.filter(p => p.id !== id);
        set({ 
          projects,
          currentProject: get().currentProject?.id === id ? null : get().currentProject,
          isLoading: false 
        });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to delete project', 
          isLoading: false 
        });
        throw error;
      }
    },

    // Board actions
    fetchBoards: async (projectId: string) => {
      set({ isLoading: true, error: null });
      try {
        const boards = await projectsApi.getBoards(projectId);
        const currentProject = get().currentProject;
        if (currentProject && currentProject.id === projectId) {
          set({ 
            currentProject: { ...currentProject, boards },
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch boards', 
          isLoading: false 
        });
      }
    },

    createBoard: async (projectId: string, boardData: CreateBoardDto) => {
      set({ isLoading: true, error: null });
      try {
        const newBoard = await projectsApi.createBoard(projectId, boardData);
        const currentProject = get().currentProject;
        if (currentProject && currentProject.id === projectId) {
          set({ 
            currentProject: {
              ...currentProject,
              boards: [...currentProject.boards, newBoard]
            },
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to create board', 
          isLoading: false 
        });
        throw error;
      }
    },

    updateBoard: async (id: string, boardData: UpdateBoardDto) => {
      set({ isLoading: true, error: null });
      try {
        const updatedBoard = await boardsApi.update(id, boardData);
        const currentProject = get().currentProject;
        if (currentProject) {
          const boards = currentProject.boards.map(b => 
            b.id === id ? updatedBoard : b
          );
          set({ 
            currentProject: { ...currentProject, boards },
            currentBoard: get().currentBoard?.id === id ? updatedBoard : get().currentBoard,
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to update board', 
          isLoading: false 
        });
        throw error;
      }
    },

    deleteBoard: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await boardsApi.delete(id);
        const currentProject = get().currentProject;
        if (currentProject) {
          const boards = currentProject.boards.filter(b => b.id !== id);
          set({ 
            currentProject: { ...currentProject, boards },
            currentBoard: get().currentBoard?.id === id ? null : get().currentBoard,
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to delete board', 
          isLoading: false 
        });
        throw error;
      }
    },

    // Member actions
    addMember: async (projectId: string, userId: string, role = 'MEMBER') => {
      set({ isLoading: true, error: null });
      try {
        const newMember = await projectsApi.addMember(projectId, userId, role);
        const currentProject = get().currentProject;
        if (currentProject && currentProject.id === projectId) {
          set({ 
            currentProject: {
              ...currentProject,
              members: [...currentProject.members, newMember]
            },
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to add member', 
          isLoading: false 
        });
        throw error;
      }
    },

    removeMember: async (projectId: string, memberId: string) => {
      set({ isLoading: true, error: null });
      try {
        await projectsApi.removeMember(projectId, memberId);
        const currentProject = get().currentProject;
        if (currentProject && currentProject.id === projectId) {
          const members = currentProject.members.filter(m => m.userId !== memberId);
          set({ 
            currentProject: { ...currentProject, members },
            isLoading: false 
          });
        } else {
          set({ isLoading: false });
        }
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to remove member', 
          isLoading: false 
        });
        throw error;
      }
    },

    // Statistics
    fetchStatistics: async (projectId: string) => {
      set({ isLoading: true, error: null });
      try {
        const statistics = await tasksApi.getStatistics(projectId);
        set({ statistics, isLoading: false });
      } catch (error: any) {
        set({ 
          error: error.message || 'Failed to fetch statistics', 
          isLoading: false 
        });
      }
    },

    // State setters
    setCurrentProject: (project: Project | null) => {
      set({ currentProject: project });
    },

    setCurrentBoard: (board: Board | null) => {
      set({ currentBoard: board });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);