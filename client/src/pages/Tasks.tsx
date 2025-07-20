export const Tasks = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">
            View and manage all your assigned tasks
          </p>
        </div>
        <button className="btn-primary">
          Create Task
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">To Do</h2>
            <span className="badge-secondary">3</span>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Design homepage mockups</h3>
              <p className="text-sm text-gray-600 mt-1">Website Redesign</p>
              <div className="flex items-center justify-between mt-2">
                <span className="badge-error">High</span>
                <span className="text-xs text-gray-500">Due: Feb 15</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Research user requirements</h3>
              <p className="text-sm text-gray-600 mt-1">Mobile App</p>
              <div className="flex items-center justify-between mt-2">
                <span className="badge-warning">Medium</span>
                <span className="text-xs text-gray-500">Due: Feb 20</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
            <span className="badge-primary">2</span>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Implement authentication</h3>
              <p className="text-sm text-gray-600 mt-1">Website Redesign</p>
              <div className="flex items-center justify-between mt-2">
                <span className="badge-error">High</span>
                <span className="text-xs text-gray-500">Due: Feb 18</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Create wireframes</h3>
              <p className="text-sm text-gray-600 mt-1">Mobile App</p>
              <div className="flex items-center justify-between mt-2">
                <span className="badge-warning">Medium</span>
                <span className="text-xs text-gray-500">Due: Feb 25</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Done</h2>
            <span className="badge-success">1</span>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">Set up development environment</h3>
              <p className="text-sm text-gray-600 mt-1">Website Redesign</p>
              <div className="flex items-center justify-between mt-2">
                <span className="badge-success">Completed</span>
                <span className="text-xs text-gray-500">Feb 10</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};