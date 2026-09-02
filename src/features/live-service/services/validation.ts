import { z } from "zod";

export const liveServiceSchema = z.object({
  title: z.string().trim().min(2, "Enter a service title.").max(160),
  serviceType: z.string().trim().min(2, "Enter a service type.").max(80),
  scheduledFor: z.string().trim().max(48).optional(),
  speaker: z.string().trim().max(120).optional(),
});

type ParsedSchedule = { data: string | null } | { error: string };

export function parseScheduledFor(value?: string): ParsedSchedule {
  if (!value) return { data: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: "Enter a valid service date and time." };
  }
  return { data: date.toISOString() };
}
