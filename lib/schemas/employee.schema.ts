import { z } from "zod";

export const employeeSchema = z.object({
  full_name: z.string().min(1, "Обязательное поле"),
  department: z.string().optional(),
  position: z.string().optional(),
  email: z.string().email("Некорректный email").optional().or(z.literal("")),
  employee_number: z.string().optional(),
  is_active: z.boolean().default(true),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
<<<<<<< HEAD

/** Schema for validating a single employee row fetched from the database */
export const employeeRowSchema = z.object({
  id: z.string(),
  full_name: z.string(),
  department: z.string().nullable(),
  position: z.string().nullable(),
  email: z.string().nullable(),
  employee_number: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type EmployeeRow = z.infer<typeof employeeRowSchema>;

/** Schema for validating workplace data with nested computer relation */
export const workplaceWithComputerSchema = z.object({
  id: z.string(),
  room: z.string(),
  computer_id: z.string().nullable(),
  computers: z.object({
    inventory_number: z.string(),
  }).nullable(),
}).nullable();

export type WorkplaceWithComputer = z.infer<typeof workplaceWithComputerSchema>;
=======
>>>>>>> 72a72aed7fd900b0efcd88a2585fb0bd1f99dd9f
