import { Router, type Request } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import {
  processAlipayNotification,
  processWechatNotification,
} from "../services/paymentService.js";

type RawBodyRequest = Request & { rawBody?: string };

export const paymentsRoutes = Router();

paymentsRoutes.post(
  "/wechat/notify",
  asyncRoute(async (request: RawBodyRequest, response) => {
    await processWechatNotification({
      rawBody: request.rawBody ?? JSON.stringify(request.body),
      timestamp: request.get("wechatpay-timestamp") ?? "",
      nonce: request.get("wechatpay-nonce") ?? "",
      signature: request.get("wechatpay-signature") ?? "",
      serial: request.get("wechatpay-serial") ?? "",
    });
    response.json({ code: "SUCCESS", message: "成功" });
  }),
);

paymentsRoutes.post(
  "/alipay/notify",
  asyncRoute(async (request, response) => {
    await processAlipayNotification(request.body as Record<string, unknown>);
    response.type("text/plain").send("success");
  }),
);
