import { z } from "zod";

/** Schema for the merged licenses table (software + license pool combined) */
export const licenseSchema = z.object({
  software_name: z.string().min(1, "Обязательное поле"),
  version: z.string().optional(),
  vendor: z.string().optional(),
  license_type: z.enum(["perpetual", "subscription"]),
  license_key: z.string().optional(),
  total_seats: z.coerce.number().int().min(1, "Минимум 1").default(1),
  price_per_unit: z.coerce.number().min(0, "Минимум 0").default(0),
  expires_at: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export type LicenseFormValues = z.infer<typeof licenseSchema>;
