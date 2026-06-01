import { z } from "zod";

export const hardwareSchema = z.object({
  cpu: z.string().optional().nullable().or(z.literal("")),
  ram: z.string().optional().nullable().or(z.literal("")),
  storage: z.string().optional().nullable().or(z.literal("")),
  gpu: z.string().optional().nullable().or(z.literal("")),
  mac_address: z.string().optional().nullable().or(z.literal("")),
  diagonal: z.string().optional().nullable().or(z.literal("")),
  resolution: z.string().optional().nullable().or(z.literal("")),
});

export const deviceSchema = z.object({
  inventory_number: z.string().min(1, "Обязательное поле"),
  serial_number: z.string().optional().nullable().or(z.literal("")),
  computer_type: z.string().min(1, "Обязательное поле"), // We use computer_type field in DB as Name/Model
  room: z.string().optional().nullable().or(z.literal("")),
  lifecycle_status: z.enum(["active", "repair", "decommissioned", "storage"]),
  device_type: z.enum(["pc", "monitor", "keyboard", "mouse", "printer", "other"]),
  hardware: hardwareSchema.optional().nullable(),
  template_id: z.string().optional().nullable().or(z.literal("")),
  photo_urls: z.array(z.string()).optional().nullable(),
}).superRefine((data, ctx) => {
  if (data.device_type === "pc") {
    if (!data.hardware?.cpu || !data.hardware.cpu.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Процессор обязателен для ПК",
        path: ["cpu"],
      });
    }
  } else if (data.device_type === "monitor") {
    if (!data.hardware?.diagonal || !data.hardware.diagonal.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Диагональ обязательна для монитора",
        path: ["diagonal"],
      });
    }
    if (!data.hardware?.resolution || !data.hardware.resolution.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Разрешение обязательно для монитора",
        path: ["resolution"],
      });
    }
  }
});

export type DeviceFormValues = z.infer<typeof deviceSchema>;

export const hardwareRowSchema = hardwareSchema;

export const deviceRowSchema = z.object({
  id: z.string(),
  inventory_number: z.string(),
  serial_number: z.string().nullable(),
  computer_type: z.string().nullable(), // Name/Model
  room: z.string().nullable(),
  lifecycle_status: z.enum(["active", "repair", "decommissioned", "storage"]),
  device_type: z.enum(["pc", "monitor", "keyboard", "mouse", "printer", "other"]),
  hardware: z.unknown().nullable(),
  template_id: z.string().nullable(),
  employee_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DeviceRow = z.infer<typeof deviceRowSchema>;

export const incidentRowSchema = z.object({
  id: z.string(),
  incident_type: z.enum(["hardware", "software", "network", "other"]),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved"]),
  created_at: z.string(),
});

export type IncidentRow = z.infer<typeof incidentRowSchema>;
export const incidentRowArraySchema = z.array(incidentRowSchema);

export const deviceLicenseRowSchema = z.object({
  id: z.string(),
  installed_at: z.string(),
  licenses: z.object({
    id: z.string(),
    software_name: z.string(),
    version: z.string().nullable(),
  }).nullable(),
});

export type DeviceLicenseRow = z.infer<typeof deviceLicenseRowSchema>;
export const deviceLicenseArraySchema = z.array(deviceLicenseRowSchema);
