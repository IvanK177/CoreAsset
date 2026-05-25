import { z } from "zod";

export const employeeSchema = z.object({
  full_name: z.string().min(1, "Обязательное поле"),
  position: z.string().min(1, "Обязательное поле"),
  email: z.string().email("Некорректный email"),
  room: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string().optional(),
  role: z.enum(["admin", "employee"]),
  is_active: z.boolean().default(true),
});

/** Schema for updating an employee — is_active is managed by dismiss/restore actions */
export const employeeUpdateSchema = employeeSchema.omit({ is_active: true });

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
export type EmployeeUpdateValues = z.infer<typeof employeeUpdateSchema>;

/** Schema for validating a single employee row fetched from the database */
export const employeeRowSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  position: z.string().nullable(),
  email: z.string().nullable(),
  room: z.string().nullable(),
  phone: z.string().nullable(),
  telegram: z.string().nullable(),
  role: z.enum(["admin", "employee"]),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EmployeeRow = z.infer<typeof employeeRowSchema>;
