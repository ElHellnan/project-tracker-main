import { useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';

export const Projects = () => {
  const { projects, fetchProjects, isLoading } = useProjectStore();

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
        <button className="btn-primary">
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
              <button className="text-gray-400 hover:text-gray-600">
                <span className="text-lg">⋮</span>
              </button>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {project.description || 'No description available'}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{project._count?.boards} boards</span>
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
          <button className="btn-primary">
            Create Your First Project
          </button>
        </div>
      )}
    </div>
  );
};