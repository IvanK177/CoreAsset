import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Title & Subtitle Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-gray-200 dark:bg-slate-800" />
        <Skeleton className="h-4 w-72 bg-gray-100 dark:bg-slate-900" />
      </div>

      {/* Metric Cards Skeleton (Grid of 5 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28 bg-gray-100 dark:bg-slate-800" />
              <Skeleton className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-slate-800" />
            </div>
            <div className="space-y-1.5 pt-1">
              <Skeleton className="h-7 w-20 bg-gray-200 dark:bg-slate-700" />
              <Skeleton className="h-3 w-32 bg-gray-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List/Table Skeleton (2/3 width) */}
        <div className="lg:col-span-2 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-gray-50 dark:border-slate-800">
            <Skeleton className="h-5 w-36 bg-gray-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-slate-800" />
          </div>

          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 dark:border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3 w-full max-w-[70%]">
                  <Skeleton className="h-9 w-9 rounded-lg bg-gray-100 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-[60%] bg-gray-200 dark:bg-slate-700" />
                    <Skeleton className="h-3.5 w-[30%] bg-gray-100 dark:bg-slate-800" />
                  </div>
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <Skeleton className="h-5.5 w-16 rounded-full bg-gray-100 dark:bg-slate-800" />
                  <Skeleton className="h-5.5 w-16 rounded-full bg-gray-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Widgets (1/3 width) */}
        <div className="space-y-4">
          {/* Widget 1 */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-sm">
            <Skeleton className="h-4 w-24 bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28 bg-gray-100 dark:bg-slate-800" />
                <Skeleton className="h-4 w-8 bg-gray-100 dark:bg-slate-800" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-24 bg-gray-100 dark:bg-slate-800" />
                <Skeleton className="h-4 w-8 bg-gray-100 dark:bg-slate-800" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32 bg-gray-100 dark:bg-slate-800" />
                <Skeleton className="h-4 w-8 bg-gray-100 dark:bg-slate-800" />
              </div>
            </div>
          </div>

          {/* Widget 2 */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 shadow-sm">
            <Skeleton className="h-4 w-36 bg-gray-200 dark:bg-slate-800" />
            <div className="space-y-3 pt-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3.5 w-32 bg-gray-100 dark:bg-slate-800" />
                    <Skeleton className="h-3.5 w-12 bg-gray-100 dark:bg-slate-800" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full bg-gray-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
