import { z } from "zod";

export const freeReportSchema = z.object({
  profileType: z.string().min(1),
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  risks: z.array(z.string().min(1)).length(3),
  recommendedFields: z.array(z.string().min(1)).length(3),
  parentSummary: z.string().min(1),
  disclaimer: z.string().min(1),
});

export const recommendedMajorSchema = z.object({
  name: z.string().min(1),
  fit: z.string().min(1),
  reason: z.string().min(1),
  risk: z.string().min(1),
});

export const cautiousMajorSchema = z.object({
  name: z.string().min(1),
  riskLevel: z.string().min(1),
  reason: z.string().min(1),
  whenToConsider: z.string().min(1),
});

export const fullReportSchema = z.object({
  profileType: z.string().min(1),
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  coreConflict: z.string().min(1),
  recommendedMajors: z.array(recommendedMajorSchema).min(6),
  cautiousMajors: z.array(cautiousMajorSchema).min(4),
  rankStrategy: z.object({
    summary: z.string().min(1),
    chong: z.string().min(1),
    wen: z.string().min(1),
    bao: z.string().min(1),
  }),
  pathAnalysis: z.object({
    postgraduate: z.string().min(1),
    civilService: z.string().min(1),
    employment: z.string().min(1),
  }),
  familyAdvice: z.string().min(1),
  parentSummary: z.string().min(1),
  disclaimer: z.string().min(1),
});

export const reportIdSchema = z.object({
  reportId: z.string().uuid(),
});

export type FreeReport = z.infer<typeof freeReportSchema>;
export type FullReport = z.infer<typeof fullReportSchema>;
