import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useProjectStore } from '../store/projectStore';
import { useTaskStore } from '../store/taskStore';

// Task Card Component
const TaskCard = ({ task, onDelete, onEdit }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow cursor-move"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
        <div className="flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="text-gray-400 hover:text-blue-600 text-xs"
          >
            ✎
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="text-gray-400 hover:text-red-600 text-xs"
          >
            ×
          </button>
        </div>
      </div>
      
      {task.description && (
        <p className="text-gray-600 text-xs mb-2">{task.description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
          <span className="text-xs text-gray-500 capitalize">{task.priority?.toLowerCase()}</span>
        </div>
        {task.dueDate && (
          <span className="text-xs text-gray-500">
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

// Column Component (like Monday.com columns)
const BoardColumn = ({ column, tasks, onTaskAdd, onTaskDelete, onTaskEdit }) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });

  const handleAddTask = async () => {
    if (newTask.title.trim()) {
      await onTaskAdd({ ...newTask, columnId: column.id });
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '' });
      setShowAddTask(false);
    }
  };

  const getColumnColor = (columnName) => {
    switch (columnName.toLowerCase()) {
      case 'to do': return 'bg-red-100 border-red-200';
      case 'in progress': return 'bg-yellow-100 border-yellow-200';
      case 'done': return 'bg-green-100 border-green-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  return (
    <div className={`${getColumnColor(column.name)} border-2 border-dashed rounded-lg p-4 min-h-96 flex-1 mx-2`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <span className="mr-2">📋</span>
          {column.name}
          <span className="ml-2 bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </h3>
        <button
          onClick={() => setShowAddTask(true)}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
        >
          + Add
        </button>
      </div>

      {showAddTask && (
        <div className="bg-white p-3 rounded-lg mb-3 border-2 border-blue-200">
          <input
            type="text"
            placeholder="Task title..."
            className="w-full p-2 border border-gray-300 rounded mb-2 text-sm"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <textarea
            placeholder="Description..."
            className="w-full p-2 border border-gray-300 rounded mb-2 text-sm h-16"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <div className="flex space-x-2 mb-2">
            <select
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
            >
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
            </select>
            <input
              type="date"
              className="flex-1 p-2 border border-gray-300 rounded text-sm"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAddTask(false)}
              className="px-3 py-1 text-gray-600 border border-gray-300 rounded text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTask}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Task
            </button>
          </div>
        </div>
      )}

      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onDelete={onTaskDelete}
            onEdit={onTaskEdit}
          />
        ))}
      </SortableContext>

      {tasks.length === 0 && !showAddTask && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-sm">No tasks yet</p>
          <p className="text-xs">Click "Add" to create your first task</p>
        </div>
      )}
    </div>
  );
};

export const Board = ({ projectId }) => {
  const { projects, fetchProjects } = useProjectStore();
  const { createTask, deleteTask } = useTaskStore();
  const [editingTask, setEditingTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const project = projects.find(p => p.id === projectId) || projects[0];
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No project found</h2>
        <p className="text-gray-600">Create a project first to start managing tasks</p>
      </div>
    );
  }

  const board = project.boards?.[0];
  if (!board) return <div>No board available</div>;

  const handleTaskAdd = async (taskData) => {
    try {
      await createTask(taskData);
      fetchProjects(); // Refresh to show new task
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      fetchProjects(); // Refresh to remove task
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleTaskEdit = (task) => {
    setEditingTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Handle drag and drop logic here
    console.log('Dragged', active.id, 'over', over.id);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header like Monday.com */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded"
                style={{ backgroundColor: project.color }}
              />
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            </div>
            <div className="text-sm text-gray-500">
              {board.name} • {board.columns?.reduce((total, col) => total + (col.tasks?.length || 0), 0)} tasks
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              + Add Task
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              ⚙️ Settings
            </button>
          </div>
        </div>
        
        {project.description && (
          <p className="text-gray-600 mt-2">{project.description}</p>
        )}
      </div>

      {/* Board Content */}
      <div className="p-4 h-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 h-full">
            {board.columns?.map(column => {
              const columnTasks = column.tasks || [];
              return (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  onTaskAdd={handleTaskAdd}
                  onTaskDelete={handleTaskDelete}
                  onTaskEdit={handleTaskEdit}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Task</h2>
            <div className="space-y-4">
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-md"
                value={editingTask.title}
                onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
              />
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                value={editingTask.description || ''}
                onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                rows={3}
              />
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={editingTask.priority}
                onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
              >
                <option value="LOW">Low Priority</option>
                <option value="MEDIUM">Medium Priority</option>
                <option value="HIGH">High Priority</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Update task logic here
                  setEditingTask(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};