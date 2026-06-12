import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import { requireLocalDevelopment } from "../middleware/devOnly.js";
import { orderIdParamSchema } from "../schemas/orderSchema.js";
import { markOrderPaid } from "../services/orderService.js";

export const devRoutes = Router();

devRoutes.use(requireLocalDevelopment);

devRoutes.post(
  "/orders/:orderId/mark-paid",
  asyncRoute(async (request, response) => {
    const { orderId } = orderIdParamSchema.parse(request.params);
    response.json({ order: await markOrderPaid(orderId) });
  }),
);
