import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import { repository } from "../lib/repository.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import { orderIdParamSchema } from "../schemas/orderSchema.js";
import { markOrderPaid } from "../services/orderService.js";

export const adminRoutes = Router();

adminRoutes.use(requireAdmin);

adminRoutes.post(
  "/orders/:orderId/mark-paid",
  asyncRoute(async (request, response) => {
    const { orderId } = orderIdParamSchema.parse(request.params);
    response.json({ order: await markOrderPaid(orderId) });
  }),
);

adminRoutes.get(
  "/orders",
  asyncRoute(async (_request, response) => {
    response.json({ orders: await repository.listOrders() });
  }),
);

adminRoutes.get(
  "/reports",
  asyncRoute(async (_request, response) => {
    response.json({ reports: await repository.listReports() });
  }),
);
