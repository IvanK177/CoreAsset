"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EmployeeDetailError({
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
      <h2 className="text-xl font-bold">Ошибка загрузки сотрудника</h2>
      <p className="text-sm text-muted-foreground max-w-md text-center">
        Не удалось получить данные сотрудника. Возможна проблема с подключением к серверу или запись была изменена.
      </p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono">Код: {error.digest}</p>
      )}
      <div className="flex gap-3 mt-2">
        <Button variant="outline" onClick={() => reset()}>Попробовать снова</Button>
        <Link href="/employees">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> К списку сотрудников
          </Button>
        </Link>
      </div>
    </div>
  );
}