import { z } from "zod";
import { config } from "../lib/config.js";
import { HttpError } from "../lib/httpError.js";
import { repository } from "../lib/repository.js";
import {
  createWechatNativePayment,
  decryptWechatResource,
  fromWechatOutTradeNo,
  verifyWechatNotification,
} from "../lib/wechatPay.js";

const notificationSchema = z.object({
  event_type: z.string(),
  resource: z.object({
    ciphertext: z.string().min(1),
    nonce: z.string().min(1),
    associated_data: z.string().optional(),
  }),
});

export function paymentMode() {
  return config.WECHAT_PAY_ENABLED ? "wechat_native" as const : "development" as const;
}

export async function initiateOrderPayment(orderId: string) {
  const order = await repository.getOrder(orderId);
  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  if (order.status === "paid") {
    return { orderId, status: order.status, paymentMode: paymentMode(), codeUrl: null };
  }
  const paidOrder = await repository.getPaidOrderByReport(order.reportId);
  if (paidOrder) {
    return {
      orderId: paidOrder.id,
      status: paidOrder.status,
      paymentMode: paidOrder.paymentMethod === "wechat_native"
        ? "wechat_native" as const
        : "development" as const,
      codeUrl: null,
    };
  }
  if (!config.WECHAT_PAY_ENABLED) {
    return {
      orderId,
      status: order.status,
      paymentMode: "development" as const,
      codeUrl: null,
    };
  }
  const savedCodeUrl = order.transactionNote?.startsWith("wechat_code_url:")
    ? order.transactionNote.slice("wechat_code_url:".length)
    : null;
  if (savedCodeUrl) {
    return {
      orderId,
      status: order.status,
      paymentMode: "wechat_native" as const,
      codeUrl: savedCodeUrl,
    };
  }
  const payment = await createWechatNativePayment(order);
  await repository.updateOrderTransactionNote(
    order.id,
    `wechat_code_url:${payment.code_url}`,
  );
  return {
    orderId,
    status: order.status,
    paymentMode: "wechat_native" as const,
    codeUrl: payment.code_url,
  };
}

export async function getOrderPaymentStatus(orderId: string) {
  const order = await repository.getOrder(orderId);
  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  const paidOrder = order.status === "paid"
    ? order
    : await repository.getPaidOrderByReport(order.reportId);
  if (paidOrder) {
    return {
      orderId: paidOrder.id,
      reportId: paidOrder.reportId,
      status: paidOrder.status,
      paymentMode: paidOrder.paymentMethod === "wechat_native"
        ? "wechat_native" as const
        : "development" as const,
      paidAt: paidOrder.paidAt,
    };
  }
  return {
    orderId: order.id,
    reportId: order.reportId,
    status: order.status,
    paymentMode: order.paymentMethod === "wechat_native"
      ? "wechat_native" as const
      : "development" as const,
    paidAt: order.paidAt,
  };
}

export async function processWechatNotification(input: {
  rawBody: string;
  timestamp: string;
  nonce: string;
  signature: string;
  serial: string;
}) {
  if (!config.WECHAT_PAY_ENABLED) {
    throw new HttpError(404, "API route not found", "ROUTE_NOT_FOUND");
  }
  verifyWechatNotification(input, input.rawBody);
  const notification = notificationSchema.parse(JSON.parse(input.rawBody));
  if (notification.event_type !== "TRANSACTION.SUCCESS") return;

  const transaction = decryptWechatResource(notification.resource);
  if (
    transaction.mchid !== config.WECHAT_PAY_MCH_ID ||
    transaction.appid !== config.WECHAT_PAY_APP_ID ||
    transaction.trade_state !== "SUCCESS"
  ) {
    throw new HttpError(400, "WeChat Pay transaction mismatch", "WECHAT_TRANSACTION_MISMATCH");
  }

  const orderId = fromWechatOutTradeNo(transaction.out_trade_no);
  const order = await repository.getOrder(orderId);
  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  if (
    order.paymentMethod !== "wechat_native" ||
    order.amount !== transaction.amount.total ||
    transaction.amount.currency !== "CNY"
  ) {
    throw new HttpError(400, "WeChat Pay amount mismatch", "WECHAT_AMOUNT_MISMATCH");
  }
  if (order.status === "paid") return;

  const paidOrder = await repository.markOrderPaid(
    order.id,
    `wechat_transaction_id:${transaction.transaction_id}`,
  );
  await repository.ensureUsageLimit(paidOrder);
  await repository.createAdminLog({
    action: "wechat_payment_succeeded",
    targetType: "order",
    targetId: paidOrder.id,
    note: `transaction_id=${transaction.transaction_id}`,
  });
}
