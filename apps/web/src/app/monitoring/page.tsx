'use client';

import React from 'react';
import { SystemHealthDashboard } from '@/components/Monitoring/SystemHealthDashboard';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring and health status of the Investie platform infrastructure
          </p>
        </div>

        <SystemHealthDashboard />
      </div>
    </div>
  );
}