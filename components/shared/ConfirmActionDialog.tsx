"use client";

import { useTransition } from "react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Подтверждение",
  description = "Вы уверены, что хотите выполнить это действие?",
  confirmLabel = "Подтвердить",
  variant = "destructive",
}: ConfirmActionDialogProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Отмена</Button>
          <Button
            variant={variant}
            disabled={isPending}
            className="gap-2"
            onClick={() => { startTransition(() => { onConfirm(); }); }}
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPending ? `${confirmLabel}…` : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}