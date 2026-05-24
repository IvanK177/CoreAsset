import { z } from "zod";

export const softwareSchema = z.object({
  name: z.string().min(1, "Обязательное поле"),
  version: z.string().optional(),
  vendor: z.string().optional(),
});

export const licensePoolSchema = z.object({
  software_id: z.string().uuid("Выберите ПО"),
  license_type: z.enum(["perpetual", "subscription"]),
  total_seats: z.coerce.number().int().min(1, "Минимум 1"),
  price_per_unit: z.coerce.number().min(0, "Минимум 0").default(0),
  expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type SoftwareFormValues = z.infer<typeof softwareSchema>;
export type LicensePoolFormValues = z.infer<typeof licensePoolSchema>;
