'use client';

import React, { useState } from 'react';
import { Task } from '@/types';
import { useTasks } from '@/contexts/TaskContext';

interface TaskItemProps {
  task: Task;
}

const priorityColors: Record<Task['priority'], string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { toggleTask, deleteTask, updateTask, state } = useTasks();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [editedDescription, setEditedDescription] = useState(task.description || '');
  const [editedPriority, setEditedPriority] = useState<Task['priority']>(task.priority);
  const [editedCategory, setEditedCategory] = useState(task.category);
  const [editedTags, setEditedTags] = useState(task.tags.join(', '));
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate || '');

  const startEditing = () => {
    setEditedTitle(task.title);
    setEditedDescription(task.description || '');
    setEditedPriority(task.priority);
    setEditedCategory(task.category);
    setEditedTags(task.tags.join(', '));
    setEditedDueDate(task.dueDate || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!editedTitle.trim()) return;

    const tags = Array.from(
      new Set(
        editedTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      )
    );

    updateTask(task.id, {
      title: editedTitle.trim(),
      description: editedDescription.trim() || undefined,
      priority: editedPriority,
      category: editedCategory,
      tags,
      dueDate: editedDueDate || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!window.confirm(`确定要删除任务「${task.title}」吗？`)) return;
    deleteTask(task.id);
  };

  const inputClass =
    'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div
      className={`mb-3 p-4 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 ${
        task.completed ? 'bg-gray-50' : 'bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => toggleTask(task.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
            task.completed
              ? 'bg-primary border-primary text-white'
              : 'border-gray-300 hover:border-primary'
          }`}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
        >
          {task.completed && (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-grow">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>Title</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className={inputClass}
                  placeholder="Task title"
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className={inputClass}
                  placeholder="Task description (optional)"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Priority</label>
                  <select
                    value={editedPriority}
                    onChange={(e) => setEditedPriority(e.target.value as Task['priority'])}
                    className={inputClass}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    value={editedCategory}
                    onChange={(e) => setEditedCategory(e.target.value)}
                    className={inputClass}
                  >
                    {Array.from(new Set([...state.categories, task.category])).map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={editedTags}
                    onChange={(e) => setEditedTags(e.target.value)}
                    className={inputClass}
                    placeholder="work, urgent"
                  />
                </div>
                <div>
                  <label className={labelClass}>Due date</label>
                  <input
                    type="date"
                    value={editedDueDate}
                    onChange={(e) => setEditedDueDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={!editedTitle.trim()}
                  className="px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3
                className={`text-lg font-medium ${
                  task.completed ? 'text-gray-400 line-through' : 'text-gray-800'
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2 items-center text-xs">
                <span className={`px-2 py-1 rounded-full text-white text-xs ${priorityColors[task.priority]}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
                <span className="px-2 py-1 bg-neutral-light text-neutral rounded-full">
                  {task.category}
                </span>
                {task.tags.map((tag) => (
                  <span key={tag} className="px-2 py-1 bg-neutral-light text-neutral rounded-full">
                    #{tag}
                  </span>
                ))}
                {task.dueDate && (
                  <span className="text-gray-500">
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex gap-2">
          {!isEditing && (
            <button
              onClick={startEditing}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Edit task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Delete task"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;
