import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { Board } from './Board';

export const Projects = () => {
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'board'
  const [newProject, setNewProject] = useState({ name: '', description: '', color: '#3B82F6' });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // If viewing a specific project board
  if (selectedProject && viewMode === 'board') {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4">
          <button
            onClick={() => setSelectedProject(null)}
            className="text-blue-600 hover:text-blue-800 mb-2 flex items-center"
          >
            ← Back to Projects
          </button>
        </div>
        <div className="flex-1">
          <Board projectId={selectedProject} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Monday.com style */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <span className="mr-3">🚀</span>
              My Workspace
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your projects and track progress like Monday.com
            </p>
          </div>
          <button 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="mr-2">+</span>
            Add Project
          </button>
        </div>
      </div>

      {/* Projects Grid - Monday.com style */}
      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <div 
            key={project.id} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer"
            onClick={() => {
              setSelectedProject(project.id);
              setViewMode('board');
            }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{project.name}</h3>
                    <p className="text-gray-600 text-sm">{project.description || 'No description'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Project Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-1">📋</span>
                      <span>{project.boards?.length || 0} boards</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">✓</span>
                      <span>
                        {project.boards?.reduce((total, board) => 
                          total + (board.columns?.reduce((colTotal, col) => 
                            colTotal + (col.tasks?.length || 0), 0) || 0), 0) || 0} tasks
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      <span>{project.members?.length || 0} members</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProject(project.id);
                        setViewMode('board');
                      }}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                    >
                      Open Board
                    </button>
                    <button 
                      className="px-3 py-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this project?')) {
                          deleteProject(project.id);
                        }
                      }}
                      title="Delete project"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all"
                    style={{ backgroundColor: project.color, width: '75%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-6xl mb-4">🚀</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Your Workspace!
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Create your first project to start organizing your work like Monday.com. 
            Add boards, columns, and tasks to track everything efficiently.
          </p>
          <button 
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-medium inline-flex items-center"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="mr-2">+</span>
            Create Your First Project
          </button>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Describe your project"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Theme
                </label>
                <div className="flex space-x-3">
                  {['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'].map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${newProject.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProject({...newProject, color})}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-8">
              <button
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({ name: '', description: '', color: '#3B82F6' });
                }}
              >
                Cancel
              </button>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                onClick={async () => {
                  if (newProject.name.trim()) {
                    try {
                      await createProject(newProject);
                      setShowCreateModal(false);
                      setNewProject({ name: '', description: '', color: '#3B82F6' });
                    } catch (error) {
                      alert('Failed to create project');
                    }
                  }
                }}
                disabled={!newProject.name.trim()}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};