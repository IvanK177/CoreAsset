import { z } from "zod";

export const incidentSchema = z.object({
  computer_id: z.string().uuid().optional().or(z.literal("")),
  incident_type: z.enum(["hardware", "software", "network", "other"]),
  description: z.string().min(1, "Обязательное поле"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved"]),
});

export type IncidentFormValues = z.infer<typeof incidentSchema>;
