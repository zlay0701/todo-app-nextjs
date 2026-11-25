'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  ReactNode,
} from 'react';
import { TaskState, TaskAction, Task, WebDavConfig, SyncStatus } from '@/types';
import {
  syncTasksWithWebDav,
  loadTasksFromWebDav,
  resolveConflicts,
} from '@/utils/syncManager';

const STORAGE_KEYS = {
  tasks: 'tasks',
  categories: 'categories',
  tags: 'tags',
  webDavConfig: 'webDavConfig',
  webDavPassword: 'webDavPassword',
};

const initialState: TaskState = {
  tasks: [],
  categories: ['Personal', 'Work', 'Study', 'Other'],
  tags: [],
  filter: {},
  webDavConfig: {
    serverUrl: '',
    username: '',
    password: '',
    enabled: false,
    autoSync: false,
    syncInterval: 5,
  },
  syncStatus: {
    status: 'idle',
  },
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_TASK': {
      const newTask: Task = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }

    case 'UPDATE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    }

    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    }

    case 'TOGGLE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, completed: !task.completed, updatedAt: new Date().toISOString() }
            : task
        ),
      };
    }

    case 'SET_FILTER': {
      return { ...state, filter: { ...state.filter, ...action.payload } };
    }

    case 'ADD_CATEGORY': {
      if (state.categories.includes(action.payload)) return state;
      return { ...state, categories: [...state.categories, action.payload] };
    }

    case 'ADD_TAG': {
      if (state.tags.includes(action.payload)) return state;
      return { ...state, tags: [...state.tags, action.payload] };
    }

    case 'SET_WEBDAV_CONFIG': {
      return { ...state, webDavConfig: action.payload };
    }

    case 'SET_SYNC_STATUS': {
      return { ...state, syncStatus: action.payload };
    }

    case 'SYNC_TASKS': {
      return { ...state, tasks: action.payload };
    }

    case 'CLEAR_COMPLETED': {
      return { ...state, tasks: state.tasks.filter((task) => !task.completed) };
    }

    case 'IMPORT_TASKS': {
      return { ...state, tasks: action.payload };
    }

    default:
      return state;
  }
};

interface TaskContextType {
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;
  setFilter: (filter: Partial<TaskState['filter']>) => void;
  addCategory: (category: string) => void;
  addTag: (tag: string) => void;
  setWebDavConfig: (config: WebDavConfig) => void;
  syncTasks: () => Promise<void>;
  loadTasks: () => Promise<void>;
  clearCompletedTasks: () => void;
  importTasks: (tasks: Task[]) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // 始终保存最新状态，供定时器与同步函数读取，避免闭包捕获旧值
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const hydrated = useRef(false);

  // 从本地存储恢复数据。密码只存在会话存储中，刷新页面后需重新输入。
  useEffect(() => {
    const savedTasks = localStorage.getItem(STORAGE_KEYS.tasks);
    const savedCategories = localStorage.getItem(STORAGE_KEYS.categories);
    const savedTags = localStorage.getItem(STORAGE_KEYS.tags);
    const savedConfig = localStorage.getItem(STORAGE_KEYS.webDavConfig);
    const savedPassword = sessionStorage.getItem(STORAGE_KEYS.webDavPassword);

    if (savedTasks) {
      try {
        dispatch({ type: 'SYNC_TASKS', payload: JSON.parse(savedTasks) });
      } catch (error) {
        console.error('Failed to parse saved tasks:', error);
      }
    }

    if (savedCategories) {
      try {
        (JSON.parse(savedCategories) as string[]).forEach((category) => {
          dispatch({ type: 'ADD_CATEGORY', payload: category });
        });
      } catch (error) {
        console.error('Failed to parse saved categories:', error);
      }
    }

    if (savedTags) {
      try {
        (JSON.parse(savedTags) as string[]).forEach((tag) => {
          dispatch({ type: 'ADD_TAG', payload: tag });
        });
      } catch (error) {
        console.error('Failed to parse saved tags:', error);
      }
    }

    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig) as WebDavConfig;
        const password = savedPassword || '';
        dispatch({
          type: 'SET_WEBDAV_CONFIG',
          payload: {
            ...config,
            password,
            enabled: config.enabled && !!password,
          },
        });
      } catch (error) {
        console.error('Failed to parse saved WebDAV config:', error);
      }
    }

    hydrated.current = true;
  }, []);

  // 状态变化时写回本地存储。hydrate 完成前不写，避免用空状态覆盖已保存的数据。
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(state.categories));
    localStorage.setItem(STORAGE_KEYS.tags, JSON.stringify(state.tags));

    const { password, ...configWithoutPassword } = state.webDavConfig;
    localStorage.setItem(
      STORAGE_KEYS.webDavConfig,
      JSON.stringify(configWithoutPassword)
    );
    if (password) {
      sessionStorage.setItem(STORAGE_KEYS.webDavPassword, password);
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.webDavPassword);
    }
  }, [state.tasks, state.categories, state.tags, state.webDavConfig]);

  const setSyncStatus = useCallback((status: SyncStatus) => {
    dispatch({ type: 'SET_SYNC_STATUS', payload: status });
  }, []);

  // 双向同步：先拉取远端，按 updatedAt 合并冲突，再把合并结果写回远端。
  // 使用 ref 读取最新状态，保证函数引用稳定，不会让自动同步定时器反复重建。
  const syncTasks = useCallback(async () => {
    const { webDavConfig: config, tasks: localTasks } = stateRef.current;
    if (!config.enabled) return;

    setSyncStatus({ status: 'syncing' });
    try {
      const remoteTasks = await loadTasksFromWebDav(config);
      const mergedTasks = resolveConflicts(localTasks, remoteTasks);
      dispatch({ type: 'SYNC_TASKS', payload: mergedTasks });
      await syncTasksWithWebDav(mergedTasks, config);
      setSyncStatus({
        status: 'success',
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      setSyncStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  }, [setSyncStatus]);

  // 仅从远端拉取，用于需要放弃本地改动的场景。
  const loadTasks = useCallback(async () => {
    const { webDavConfig: config } = stateRef.current;
    if (!config.enabled) return;

    setSyncStatus({ status: 'syncing' });
    try {
      const tasks = await loadTasksFromWebDav(config);
      dispatch({ type: 'SYNC_TASKS', payload: tasks });
      setSyncStatus({
        status: 'success',
        lastSyncTime: new Date().toISOString(),
      });
    } catch (error) {
      setSyncStatus({
        status: 'error',
        error: error instanceof Error ? error.message : 'Load failed',
      });
    }
  }, [setSyncStatus]);

  // 自动同步只依赖配置项，任务变化不再重置计时器。
  useEffect(() => {
    if (!state.webDavConfig.enabled || !state.webDavConfig.autoSync) return;

    const interval = setInterval(
      () => {
        void syncTasks();
      },
      state.webDavConfig.syncInterval * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [
    state.webDavConfig.enabled,
    state.webDavConfig.autoSync,
    state.webDavConfig.syncInterval,
    syncTasks,
  ]);

  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id, updates } });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const toggleTask = (id: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: id });
  };

  const setFilter = (filter: Partial<TaskState['filter']>) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const addCategory = (category: string) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const addTag = (tag: string) => {
    dispatch({ type: 'ADD_TAG', payload: tag });
  };

  const setWebDavConfig = (config: WebDavConfig) => {
    dispatch({ type: 'SET_WEBDAV_CONFIG', payload: config });
  };

  const clearCompletedTasks = () => {
    dispatch({ type: 'CLEAR_COMPLETED' });
  };

  const importTasks = (tasks: Task[]) => {
    dispatch({ type: 'IMPORT_TASKS', payload: tasks });
  };

  const value = {
    state,
    dispatch,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    setFilter,
    addCategory,
    addTag,
    setWebDavConfig,
    syncTasks,
    loadTasks,
    clearCompletedTasks,
    importTasks,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
