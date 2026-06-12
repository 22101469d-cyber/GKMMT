import { config } from "../lib/config.js";
import { HttpError } from "../lib/httpError.js";
import { repository } from "../lib/repository.js";
import {
  freeReportSchema,
  fullReportSchema,
  type FreeReport,
  type FullReport,
} from "../schemas/reportSchema.js";
import {
  generateFreeReportWithAI,
  generateFullReportWithAI,
} from "./aiService.js";
import { sanitizeCompliance } from "./complianceService.js";

export async function generateFreeReport(profileId: string) {
  const profile = await repository.getProfile(profileId);
  if (!profile) throw new HttpError(404, "Profile not found", "PROFILE_NOT_FOUND");

  const generated = await generateFreeReportWithAI(profile);
  const cleaned = freeReportSchema.parse(
    sanitizeCompliance<FreeReport>(generated),
  );
  const record = await repository.createFreeReport(
    profile.id,
    cleaned,
    config.AI_PROVIDER === "gemini"
      ? config.GEMINI_MODEL
      : config.AI_PROVIDER === "openrouter"
        ? config.OPENROUTER_MODEL
      : config.AI_PROVIDER === "openai"
        ? config.OPENAI_MODEL
        : "mock",
  );
  return { reportId: record.id, freeReport: cleaned };
}

export async function generateFullReport(reportId: string) {
  const report = await repository.getReport(reportId);
  if (!report) throw new HttpError(404, "Report not found", "REPORT_NOT_FOUND");
  const paidOrder = await repository.getPaidOrderByReport(reportId);
  if (!paidOrder) {
    throw new HttpError(
      403,
      "A paid order is required to generate the full report",
      "PAYMENT_REQUIRED",
    );
  }
  if (report.fullReport) {
    return {
      reportId,
      fullReport: fullReportSchema.parse(report.fullReport),
    };
  }
  const profile = await repository.getProfile(report.profileId);
  if (!profile) throw new HttpError(404, "Profile not found", "PROFILE_NOT_FOUND");
  if (!report.freeReport) {
    throw new HttpError(409, "Free report must be generated first", "FREE_REPORT_REQUIRED");
  }

  const generated = await generateFullReportWithAI(profile, report.freeReport);
  const cleaned = fullReportSchema.parse(
    sanitizeCompliance<FullReport>(generated),
  );
  await repository.updateFullReport(
    reportId,
    cleaned,
    config.AI_PROVIDER === "gemini"
      ? config.GEMINI_MODEL
      : config.AI_PROVIDER === "openrouter"
        ? config.OPENROUTER_MODEL
      : config.AI_PROVIDER === "openai"
        ? config.OPENAI_MODEL
        : "mock",
  );
  return { reportId, fullReport: cleaned };
}

export async function getReportForViewer(reportId: string) {
  const report = await repository.getReport(reportId);
  if (!report) throw new HttpError(404, "Report not found", "REPORT_NOT_FOUND");
  const paidOrder = await repository.getPaidOrderByReport(reportId);
  return {
    reportId: report.id,
    freeReport: report.freeReport,
    fullReport: paidOrder ? report.fullReport : null,
    locked: !paidOrder,
  };
}
