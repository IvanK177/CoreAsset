"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<typeof Button>;

interface SubmitButtonProps extends ButtonProps {
  pendingText?: string;
}

export function SubmitButton({ pendingText, children, ...props }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      {...props}
      className={`${props.className ?? ""} ${pending ? "gap-2" : ""}`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? (pendingText ?? "Выполнение…") : children}
    </Button>
  );
}