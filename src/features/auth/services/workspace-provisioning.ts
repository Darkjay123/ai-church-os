import { z } from "zod";

export const workspaceProvisioningSchema = z.object({
  churchName: z.string().trim().min(2, "Enter your church or ministry name.").max(160),
});
