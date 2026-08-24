import { z } from "zod";

const uuidSchema = z.uuid("Choose a valid workspace record.");

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter your church or ministry name.").max(120),
  denomination: z.string().trim().max(120).optional(),
  timezone: z.string().trim().min(1, "Choose a timezone.").max(80),
  country: z.string().trim().max(80).optional(),
  defaultLanguage: z.string().trim().min(2).max(12),
});

export const profileSettingsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name.").max(120),
  phone: z.string().trim().max(40).optional(),
});

export const invitationSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  roleId: uuidSchema,
  teamId: z.union([uuidSchema, z.literal("")]).optional(),
});

export const teamSchema = z.object({
  name: z.string().trim().min(2, "Team names need at least two characters.").max(80),
  description: z.string().trim().max(280).optional(),
});

export const roleAssignmentSchema = z.object({
  profileId: uuidSchema,
  roleId: uuidSchema,
});
