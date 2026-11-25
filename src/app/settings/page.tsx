'use client';

import React from 'react';
import WebDavConfig from '@/components/WebDavConfig';
import DataManagement from '@/components/DataManagement';

export default function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <svg className="h-10 w-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-label="Todo App">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          </div>
        </header>

        <div className="max-w-2xl mx-auto">
          <WebDavConfig />
          <DataManagement />
        </div>
      </div>
    </div>
  );
}