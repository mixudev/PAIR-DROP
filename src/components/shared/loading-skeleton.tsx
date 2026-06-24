"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function FileListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-md border border-border p-4">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex h-screen">
      <div className="hidden w-64 border-r border-border p-4 md:block">
        <Skeleton className="mb-6 h-8 w-32" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="mb-2 h-9 w-full rounded-md" />
        ))}
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="mb-4 h-8 w-48" />
        <FileListSkeleton />
      </div>
    </div>
  );
}
