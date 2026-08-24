import { z } from "zod";

export const emailSchema = z.email("Enter a valid email address.").trim().toLowerCase();

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name."),
  churchName: z.string().trim().min(2, "Enter your church or ministry name."),
  email: emailSchema,
  password: passwordSchema,
});
