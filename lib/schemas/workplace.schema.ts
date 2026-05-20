import { z } from "zod";

export const workplaceSchema = z.object({
  room: z.string().min(1, "Обязательное поле"),
  computer_id: z.string().uuid().optional().or(z.literal("")),
  employee_id: z.string().uuid().optional().or(z.literal("")),
});

export type WorkplaceFormValues = z.infer<typeof workplaceSchema>;
