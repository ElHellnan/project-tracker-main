import React, { useEffect, useState } from 'react';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';

export const Tasks = () => {
  const { projects, fetchProjects } = useProjectStore();
  const { createTask, deleteTask } = useTaskStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    columnId: '',
    priority: 'MEDIUM'
  });

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Get all tasks from all projects
  const allTasks = projects.flatMap(project => 
    project.boards?.flatMap(board => 
      board.columns?.flatMap(column => 
        column.tasks?.map(task => ({ ...task, columnName: column.name, projectName: project.name })) || []
      ) || []
    ) || []
  );

  const todoTasks = allTasks.filter(task => task.columnName === 'To Do');
  const inProgressTasks = allTasks.filter(task => task.columnName === 'In Progress');
  const doneTasks = allTasks.filter(task => task.columnName === 'Done');

  // Get available columns for task creation
  const availableColumns = projects.flatMap(project => 
    project.boards?.flatMap(board => 
      board.columns?.map(column => ({
        id: column.id,
        name: column.name,
        projectName: project.name
      })) || []
    ) || []
  );

  const handleCreateTask = async () => {
    if (newTask.title.trim() && newTask.columnId) {
      try {
        await createTask(newTask);
        setShowCreateModal(false);
        setNewTask({ title: '', description: '', columnId: '', priority: 'MEDIUM' });
        fetchProjects(); // Refresh to get updated tasks
      } catch (error) {
        alert('Failed to create task');
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      fetchProjects(); // Refresh to get updated tasks
    } catch (error) {
      alert('Failed to delete task');
    }
  };

  const TaskCard = ({ task, onDelete }: { task: any, onDelete: () => void }) => (
    <div className="p-3 bg-gray-50 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{task.title}</h3>
        <button 
          className="text-red-400 hover:text-red-600 ml-2"
          onClick={onDelete}
          title="Delete task"
        >
          ×
        </button>
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      )}
      <p className="text-sm text-gray-600 mt-1">{task.projectName}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={`badge-${task.priority === 'HIGH' ? 'error' : task.priority === 'MEDIUM' ? 'warning' : 'success'}`}>
          {task.priority}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-gray-600">
            View and manage all your assigned tasks
          </p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
          disabled={availableColumns.length === 0}
        >
          Create Task
        </button>
      </div>

      {availableColumns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No projects available
          </h2>
          <p className="text-gray-600 mb-6">
            Create a project first to start adding tasks
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">To Do</h2>
              <span className="badge-secondary">{todoTasks.length}</span>
            </div>
            <div className="space-y-3">
              {todoTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onDelete={() => handleDeleteTask(task.id)} 
                />
              ))}
              {todoTasks.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No tasks in To Do</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">In Progress</h2>
              <span className="badge-primary">{inProgressTasks.length}</span>
            </div>
            <div className="space-y-3">
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onDelete={() => handleDeleteTask(task.id)} 
                />
              ))}
              {inProgressTasks.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No tasks in progress</p>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Done</h2>
              <span className="badge-success">{doneTasks.length}</span>
            </div>
            <div className="space-y-3">
              {doneTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onDelete={() => handleDeleteTask(task.id)} 
                />
              ))}
              {doneTasks.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">No completed tasks</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTask.columnId}
                  onChange={(e) => setNewTask({...newTask, columnId: e.target.value})}
                >
                  <option value="">Select a column</option>
                  {availableColumns.map(column => (
                    <option key={column.id} value={column.id}>
                      {column.projectName} - {column.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewTask({ title: '', description: '', columnId: '', priority: 'MEDIUM' });
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                onClick={handleCreateTask}
                disabled={!newTask.title.trim() || !newTask.columnId}
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};