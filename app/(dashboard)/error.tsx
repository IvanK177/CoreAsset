"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-destructive/10">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <h2 className="text-xl font-bold">Что-то пошло не так</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Произошла ошибка при загрузке данных. Попробуйте снова.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono">Код: {error.digest}</p>
      )}
      <Button variant="outline" onClick={() => reset()} className="mt-2">Попробовать снова</Button>
    </div>
  );
}