import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import { profileIdSchema } from "../schemas/profileSchema.js";
import { reportIdSchema } from "../schemas/reportSchema.js";
import {
  generateFreeReport,
  generateFullReport,
  getReportForViewer,
} from "../services/reportService.js";

export const reportsRoutes = Router();

reportsRoutes.post(
  "/free",
  asyncRoute(async (request, response) => {
    const { profileId } = profileIdSchema.parse(request.body);
    response.status(201).json(await generateFreeReport(profileId));
  }),
);

reportsRoutes.post(
  "/full",
  asyncRoute(async (request, response) => {
    const { reportId } = reportIdSchema.parse(request.body);
    response.json(await generateFullReport(reportId));
  }),
);

reportsRoutes.get(
  "/:id",
  asyncRoute(async (request, response) => {
    const { reportId } = reportIdSchema.parse({ reportId: request.params.id });
    response.json(await getReportForViewer(reportId));
  }),
);
