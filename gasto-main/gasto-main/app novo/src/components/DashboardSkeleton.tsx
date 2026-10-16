import React from 'react';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse w-full">
      {/* Top Banner / Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="w-32 h-7 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Chart / Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-36 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="w-24 h-4 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
          <div className="h-60 w-full bg-slate-200/60 dark:bg-slate-800/60 rounded-2xl" />
        </div>

        {/* Side List Skeleton */}
        <div className="p-6 rounded-3xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-4">
          <div className="w-28 h-5 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700" />
                  <div className="space-y-1.5">
                    <div className="w-20 h-3.5 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                    <div className="w-14 h-2.5 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
