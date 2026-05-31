"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddIncidentDialog } from "@/components/incidents/AddIncidentDialog";
import type { Tables } from "@/types/database.types";

type Device = Pick<Tables<"devices">, "id" | "inventory_number">;
type Employee = Pick<Tables<"employees">, "id" | "full_name" | "room">;

interface TicketDialogButtonProps {
  devices: Device[];
  employees: Employee[];
  defaultDeviceId?: string;
  defaultEmployeeId?: string;
  label?: string;
  variant?: "outline" | "default" | "ghost" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
}

export function TicketDialogButton({
  devices,
  employees,
  defaultDeviceId,
  defaultEmployeeId,
  label = "+ Создать тикет",
  variant = "outline",
  size = "sm",
  className,
}: TicketDialogButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setDialogOpen(true)}
      >
        {label}
      </Button>
      <AddIncidentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        devices={devices}
        employees={employees}
        defaultDeviceId={defaultDeviceId}
        defaultEmployeeId={defaultEmployeeId}
      />
    </>
  );
}