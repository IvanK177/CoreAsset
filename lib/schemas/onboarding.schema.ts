import { z } from "zod";

export const onboardingSchema = z.object({
  full_name: z.string().min(1, "ФИО — обязательное поле"),
  position: z.string().min(1, "Должность / Отдел — обязательное поле"),
  building: z.string().min(1, "Корпус — обязательное поле"),
  room: z.string().optional(),
  phone: z.string().optional(),
  telegram: z.string().optional(),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;