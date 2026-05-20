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
