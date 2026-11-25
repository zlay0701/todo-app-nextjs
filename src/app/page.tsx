'use client';

import React, { useState } from 'react';
import TaskForm from '@/components/TaskForm';
import TaskList from '@/components/TaskList';
import CategoryFilter from '@/components/CategoryFilter';
import SyncStatus from '@/components/SyncStatus';
import { useTasks } from '@/contexts/TaskContext';

export default function Home() {
  const [showForm, setShowForm] = useState(true);
  const { state } = useTasks();
  const { tasks } = state;

  // Calculate task statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Todo App">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h1 className="text-3xl font-bold text-gray-800">Todo App</h1>
            </div>
            <SyncStatus />
          </div>
          
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-800">{totalTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Pending Tasks</p>
              <p className="text-2xl font-bold text-primary">{pendingTasks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-sm text-gray-500">Completed Tasks</p>
              <p className="text-2xl font-bold text-secondary">{completedTasks}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Tasks</h2>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="flex items-center gap-2 px-3 py-1 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                  </svg>
                  {showForm ? 'Hide Form' : 'Add Task'}
                </button>
              </div>
              
              {showForm && <TaskForm />}
              
              <TaskList />
            </div>
          </div>
          
          <div>
            <CategoryFilter />
          </div>
        </div>
      </div>
    </div>
  );
}