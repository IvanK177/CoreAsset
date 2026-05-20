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

/** Schema for validating hardware JSON field from the database */
export const hardwareRowSchema = hardwareSchema;

/** Schema for validating a single computer row fetched from the database */
export const computerRowSchema = z.object({
  id: z.string(),
  inventory_number: z.string(),
  serial_number: z.string().nullable(),
  computer_type: z.string(),
  room: z.string().nullable(),
  lifecycle_status: z.enum(["active", "repair", "decommissioned", "storage"]),
  hardware: z.unknown().nullable(), // Json field — validated separately via hardwareRowSchema
  created_at: z.string(),
  updated_at: z.string(),
});

export type ComputerRow = z.infer<typeof computerRowSchema>;

/** Schema for validating incident rows in computer detail context */
export const incidentRowSchema = z.object({
  id: z.string(),
  incident_type: z.enum(["hardware", "software", "network", "other"]),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved"]),
  created_at: z.string(),
});

export type IncidentRow = z.infer<typeof incidentRowSchema>;

/** Schema for validating incident row array */
export const incidentRowArraySchema = z.array(incidentRowSchema);

/** Schema for validating software installation rows with nested software relation */
export const softwareInstallationRowSchema = z.object({
  id: z.string(),
  installed_at: z.string(),
  software: z.object({
    id: z.string(),
    name: z.string(),
    version: z.string().nullable(),
  }).nullable(),
});

export type SoftwareInstallationRow = z.infer<typeof softwareInstallationRowSchema>;

/** Schema for validating software installation row array */
export const softwareInstallationArraySchema = z.array(softwareInstallationRowSchema);
