import { z } from "zod";

const hardwareSchema = z.object({
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
});

export const computerSchema = z.object({
  inventory_number: z.string().min(1, "Обязательное поле"),
  serial_number: z.string().optional(),
  computer_type: z.string().min(1, "Обязательное поле"),
  room: z.string().optional(),
  lifecycle_status: z.enum(["active", "repair", "decommissioned", "storage"]),
  hardware: hardwareSchema.optional(),
});

export type ComputerFormValues = z.infer<typeof computerSchema>;
