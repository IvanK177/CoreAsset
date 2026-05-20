"use client";

<<<<<<< HEAD
import { useState, startTransition } from "react";
=======
import { useState } from "react";
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
<<<<<<< HEAD
  onConfirm: () => void | Promise<void>;
=======
  onConfirm: () => void;
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
  description?: string;
}

export function DeleteConfirmDialog({ onConfirm, description }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size="sm" className="gap-2"><Trash2 className="w-4 h-4" /> Удалить</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Подтверждение удаления</DialogTitle>
          <DialogDescription>
            {description ?? "Это действие необратимо. Данные будут удалены безвозвратно."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
          <Button
            variant="destructive"
<<<<<<< HEAD
            onClick={() => { setOpen(false); startTransition(() => { onConfirm(); }); }}
=======
            onClick={() => { setOpen(false); onConfirm(); }}
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
          >
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
