import { z } from "zod";
import {
  createAlipayWapPayment,
  fromAlipayOutTradeNo,
  verifyAlipayNotification,
} from "../lib/alipay.js";
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

function statusPaymentMode(paymentMethod: string) {
  if (paymentMethod === "wechat_native") return "wechat_native" as const;
  if (paymentMethod === "alipay_wap") return "alipay_wap" as const;
  return "development" as const;
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
      paymentMode: statusPaymentMode(paidOrder.paymentMethod),
      codeUrl: null,
      paymentUrl: null,
    };
  }
  if (!config.WECHAT_PAY_ENABLED) {
    return {
      orderId,
      status: order.status,
      paymentMode: "development" as const,
      codeUrl: null,
      paymentUrl: null,
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
      paymentUrl: null,
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
    paymentUrl: null,
  };
}

export async function initiateAlipayWapPayment(orderId: string) {
  if (!config.ALIPAY_ENABLED) {
    throw new HttpError(503, "支付宝支付暂未配置", "ALIPAY_NOT_CONFIGURED");
  }
  const order = await repository.getOrder(orderId);
  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  if (order.status === "paid") {
    return {
      orderId,
      status: order.status,
      paymentMode: "alipay_wap" as const,
      paymentUrl: null,
      codeUrl: null,
    };
  }
  const paidOrder = await repository.getPaidOrderByReport(order.reportId);
  if (paidOrder) {
    return {
      orderId: paidOrder.id,
      status: paidOrder.status,
      paymentMode: statusPaymentMode(paidOrder.paymentMethod),
      paymentUrl: null,
      codeUrl: null,
    };
  }
  const paymentUrl = createAlipayWapPayment(order);
  await repository.updateOrderTransactionNote(order.id, "alipay_wap_pending");
  return {
    orderId,
    status: order.status,
    paymentMode: "alipay_wap" as const,
    paymentUrl,
    codeUrl: null,
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
      paymentMode: statusPaymentMode(paidOrder.paymentMethod),
      paidAt: paidOrder.paidAt,
    };
  }
  return {
    orderId: order.id,
    reportId: order.reportId,
    status: order.status,
    paymentMode: statusPaymentMode(order.paymentMethod),
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

const alipayNotificationSchema = z.object({
  app_id: z.string(),
  trade_status: z.string(),
  out_trade_no: z.string(),
  trade_no: z.string().optional().default(""),
  total_amount: z.string(),
});

export async function processAlipayNotification(body: Record<string, unknown>) {
  if (!config.ALIPAY_ENABLED) {
    throw new HttpError(404, "API route not found", "ROUTE_NOT_FOUND");
  }
  if (!verifyAlipayNotification(body)) {
    throw new HttpError(400, "Invalid Alipay notification signature", "ALIPAY_SIGNATURE_INVALID");
  }
  const notification = alipayNotificationSchema.parse(body);
  if (notification.app_id !== config.ALIPAY_APP_ID) {
    throw new HttpError(400, "Alipay app mismatch", "ALIPAY_APP_MISMATCH");
  }
  if (!["TRADE_SUCCESS", "TRADE_FINISHED"].includes(notification.trade_status)) {
    return;
  }

  const orderId = fromAlipayOutTradeNo(notification.out_trade_no);
  const order = await repository.getOrder(orderId);
  if (!order) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
  const paidFen = Math.round(Number(notification.total_amount) * 100);
  if (order.amount !== paidFen) {
    throw new HttpError(400, "Alipay amount mismatch", "ALIPAY_AMOUNT_MISMATCH");
  }
  if (order.status === "paid") return;

  const paidOrder = await repository.markOrderPaid(
    order.id,
    `alipay_trade_no:${notification.trade_no}`,
  );
  await repository.ensureUsageLimit(paidOrder);
  await repository.createAdminLog({
    action: "alipay_payment_succeeded",
    targetType: "order",
    targetId: paidOrder.id,
    note: `trade_no=${notification.trade_no}`,
  });
}
