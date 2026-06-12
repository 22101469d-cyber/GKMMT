import { z } from "zod";

const requiredText = z.string().trim().min(1).max(120);

export const profileInputSchema = z.object({
  careerDirection: requiredText,
  priority: requiredText,
  longTermStudy: requiredText,
  cityPreference: requiredText,
  riskPreference: requiredText,
  province: requiredText,
  subjectType: requiredText,
  score: z.string().trim().max(20).optional().default(""),
  rank: z.string().trim().max(30).optional().default(""),
});

export const profileIdSchema = z.object({
  profileId: z.string().uuid(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
