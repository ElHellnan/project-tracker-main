import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';

export const Projects = () => {
  const { projects, fetchProjects, createProject, deleteProject, isLoading } = useProjectStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            Manage your projects and track progress
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <div key={project.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: project.color }}
                />
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
              </div>
              <button 
                className="text-red-400 hover:text-red-600"
                onClick={() => deleteProject(project.id)}
                title="Delete project"
              >
                <span className="text-lg">×</span>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description || 'No description available'}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{project.boards?.length || 0} boards</span>
              <span>{project.members.length} members</span>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-xs">
                    {project.owner.firstName[0]}{project.owner.lastName[0]}
                  </span>
                </div>
                <span className="ml-2 text-sm text-gray-600">
                  {project.owner.firstName} {project.owner.lastName}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No projects yet
          </h2>
          <p className="text-gray-600 mb-6">
            Create your first project to get started with organizing your work
          </p>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Project
          </button>
        </div>
      )}
      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  placeholder="Enter project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <input
                  type="color"
                  className="w-full p-1 border border-gray-300 rounded-md h-10"
                  value={newProject.color}
                  onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewProject({ name: '', description: '', color: '#3B82F6' });
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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