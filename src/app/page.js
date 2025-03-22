'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ECG Monitor component with no SSR
// This prevents hydration errors with client-side only libraries like recharts
const ECGMonitor = dynamic(() => import('@/components/ECGMonitor'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">ECG Monitoring System</h1>
      <div className="w-full max-w-4xl">
        <ECGMonitor />
      </div>
    </main>
  );
}