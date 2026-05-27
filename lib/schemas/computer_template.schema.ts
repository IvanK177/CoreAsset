import { z } from "zod";

const hardwareSchema = z.object({
  cpu: z.string().optional(),
  ram: z.string().optional(),
  storage: z.string().optional(),
  gpu: z.string().optional(),
  mac_address: z.string().optional(),
});

export const computerTemplateSchema = z.object({
  name: z.string().min(1, "Обязательное поле"),
  description: z.string().optional().or(z.literal("")),
  computer_type: z.string().min(1, "Обязательное поле"),
  hardware: hardwareSchema.optional(),
});

export type ComputerTemplateFormValues = z.infer<typeof computerTemplateSchema>;

export const computerTemplateRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  computer_type: z.string().nullable(),
  hardware: z.unknown().nullable(),
  created_at: z.string(),
});

export type ComputerTemplateRow = z.infer<typeof computerTemplateRowSchema>;
