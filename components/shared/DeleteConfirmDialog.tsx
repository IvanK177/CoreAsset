"use client";

import { useState, useTransition } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  onConfirm: () => void | Promise<void>;
  description?: string;
}

export function DeleteConfirmDialog({ onConfirm, description }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="gap-2" disabled={isPending}><Trash2 className="w-4 h-4" /> Удалить</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogDescription>
            {description ?? "Это действие необратимо. Данные будут удалены безвозвратно."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Отмена</Button>
          <Button
            variant="destructive"
            disabled={isPending}
            className="gap-2"
            onClick={() => { startTransition(() => { onConfirm(); }); }}
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isPending ? "Удаление…" : "Удалить"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
