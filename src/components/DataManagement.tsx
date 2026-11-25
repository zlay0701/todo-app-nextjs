'use client';

import React, { useRef, useState } from 'react';
import { Task } from '@/types';
import { useTasks } from '@/contexts/TaskContext';

const isTask = (value: unknown): value is Task => {
  if (!value || typeof value !== 'object') return false;
  const task = value as Record<string, unknown>;
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.completed === 'boolean' &&
    typeof task.createdAt === 'string' &&
    typeof task.updatedAt === 'string' &&
    (task.priority === 'low' || task.priority === 'medium' || task.priority === 'high') &&
    typeof task.category === 'string' &&
    Array.isArray(task.tags) &&
    task.tags.every((tag) => typeof tag === 'string')
  );
};

const DataManagement: React.FC = () => {
  const { state, importTasks, clearCompletedTasks } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const handleExport = () => {
    const data = JSON.stringify(state.tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tasks-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setMessage({ text: `已导出 ${state.tasks.length} 个任务`, error: false });
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('文件必须是任务数组');
      }

      const validTasks = parsed.filter(isTask);
      if (validTasks.length !== parsed.length) {
        throw new Error(
          `有 ${parsed.length - validTasks.length} 条数据格式不正确，请检查文件`
        );
      }

      if (
        !window.confirm(
          `确定要导入 ${validTasks.length} 个任务吗？当前任务将被覆盖。`
        )
      ) {
        return;
      }

      importTasks(validTasks);
      setMessage({ text: `已导入 ${validTasks.length} 个任务`, error: false });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : '导入失败',
        error: true,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearCompleted = () => {
    const count = state.tasks.filter((task) => task.completed).length;
    if (count === 0) {
      setMessage({ text: '没有已完成的任务', error: false });
      return;
    }
    if (!window.confirm(`确定要删除 ${count} 个已完成的任务吗？`)) return;

    clearCompletedTasks();
    setMessage({ text: `已删除 ${count} 个任务`, error: false });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Data management</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Export tasks as JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Import tasks from JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={handleClearCompleted}
            className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
          >
            Clear completed tasks
          </button>
          <p className="mt-2 text-sm text-gray-500">
            Permanently removes {state.tasks.filter((task) => task.completed).length} completed task(s).
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-md ${
              message.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;
