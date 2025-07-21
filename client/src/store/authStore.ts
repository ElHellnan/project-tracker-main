import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, CreateUserDto, LoginDto, UpdateUserDto, ChangePasswordDto } from '../../../shared/types';
import { authApi, getToken } from '../utils/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginDto) => Promise<void>;
  register: (userData: CreateUserDto) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updateData: UpdateUserDto) => Promise<void>;
  changePassword: (passwordData: ChangePasswordDto) => Promise<void>;
  deleteAccount: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (credentials: LoginDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.login(credentials);
            set({ 
              user: response.user!, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (error: any) {
            set({ 
              isLoading: false, 
              error: error.message || 'Login failed' 
            });
            throw error;
          }
        },

        register: async (userData: CreateUserDto) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authApi.register(userData);
            set({ 
              user: response.user!, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (error: any) {
            set({ 
              isLoading: false, 
              error: error.message || 'Registration failed' 
            });
            throw error;
          }
        },

        logout: async () => {
          try {
            await authApi.logout();
          } catch (error) {
            console.warn('Logout API call failed:', error);
          }
          set({ 
            user: null, 
            isAuthenticated: false, 
            error: null 
          });
        },

        updateProfile: async (updateData: UpdateUserDto) => {
          set({ isLoading: true, error: null });
          try {
            const updatedUser = await authApi.updateProfile(updateData);
            set({ 
              user: updatedUser, 
              isLoading: false 
            });
          } catch (error: any) {
            set({ 
              isLoading: false, 
              error: error.message || 'Profile update failed' 
            });
            throw error;
          }
        },

        changePassword: async (passwordData: ChangePasswordDto) => {
          set({ isLoading: true, error: null });
          try {
            await authApi.changePassword(passwordData);
            set({ isLoading: false });
          } catch (error: any) {
            set({ 
              isLoading: false, 
              error: error.message || 'Password change failed' 
            });
            throw error;
          }
        },

        deleteAccount: async () => {
          set({ isLoading: true, error: null });
          try {
            await authApi.deleteAccount();
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          } catch (error: any) {
            set({ 
              isLoading: false, 
              error: error.message || 'Account deletion failed' 
            });
            throw error;
          }
        },

        initializeAuth: async () => {
          const token = getToken();
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          try {
            const user = await authApi.getMe();
            set({ 
              user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } catch (error) {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    )
  )
);