import { z } from "zod";

export const incidentSchema = z.object({
  computer_id: z.string().uuid().optional(),
  employee_id: z.string().uuid().optional(),
  incident_type: z.enum(["hardware", "software", "network", "other"]),
  title: z.string().min(1, "Обязательное поле").optional().or(z.literal("")),
  description: z.string().min(1, "Обязательное поле"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "cancelled"]),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
