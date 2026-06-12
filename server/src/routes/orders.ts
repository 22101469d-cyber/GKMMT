import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import { createOrderSchema, orderIdParamSchema } from "../schemas/orderSchema.js";
import { createOrder } from "../services/orderService.js";
import {
  getOrderPaymentStatus,
  initiateAlipayWapPayment,
  initiateOrderPayment,
} from "../services/paymentService.js";

export const ordersRoutes = Router();

ordersRoutes.post(
  "/",
  asyncRoute(async (request, response) => {
    const input = createOrderSchema.parse(request.body);
    response.status(201).json(await createOrder(input));
  }),
);

ordersRoutes.get(
  "/:orderId",
  asyncRoute(async (request, response) => {
    const { orderId } = orderIdParamSchema.parse(request.params);
    response.json(await getOrderPaymentStatus(orderId));
  }),
);

ordersRoutes.post(
  "/:orderId/payment",
  asyncRoute(async (request, response) => {
    const { orderId } = orderIdParamSchema.parse(request.params);
    response.json(await initiateOrderPayment(orderId));
  }),
);

ordersRoutes.post(
  "/:orderId/alipay",
  asyncRoute(async (request, response) => {
    const { orderId } = orderIdParamSchema.parse(request.params);
    response.json(await initiateAlipayWapPayment(orderId));
  }),
);
