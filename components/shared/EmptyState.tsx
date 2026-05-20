import { FileX } from "lucide-react";

export function EmptyState({ message = "Нет данных" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <FileX className="w-10 h-10 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
