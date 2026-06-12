import { AlipaySdk } from "alipay-sdk";
import { config } from "./config.js";

function compactOrderId(orderId: string) {
  return orderId.replaceAll("-", "");
}

export function fromAlipayOutTradeNo(outTradeNo: string) {
  const compact = outTradeNo.replace(/^alipay_/, "");
  if (!/^[0-9a-f]{32}$/i.test(compact)) {
    throw new Error("Invalid Alipay merchant order number");
  }
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join("-");
}

function amountToYuan(fen: number) {
  return (fen / 100).toFixed(2);
}

function alipayClient() {
  return new AlipaySdk({
    appId: config.ALIPAY_APP_ID,
    privateKey: config.ALIPAY_PRIVATE_KEY,
    alipayPublicKey: config.ALIPAY_PUBLIC_KEY,
    gateway: config.ALIPAY_GATEWAY,
    signType: "RSA2",
    keyType: config.ALIPAY_KEY_TYPE,
  });
}

export function createAlipayWapPayment(order: {
  id: string;
  amount: number;
}) {
  const returnUrl =
    config.ALIPAY_RETURN_URL || `${config.FRONTEND_ORIGIN.replace(/\/$/, "")}/pay`;

  return alipayClient().pageExecute("alipay.trade.wap.pay", "GET", {
    notifyUrl: config.ALIPAY_NOTIFY_URL,
    returnUrl,
    bizContent: {
      out_trade_no: compactOrderId(order.id),
      total_amount: amountToYuan(order.amount),
      subject: "高考志愿 AI 完整报告",
      product_code: "QUICK_WAP_WAY",
      quit_url: returnUrl,
    },
  });
}

export function verifyAlipayNotification(body: Record<string, unknown>) {
  return alipayClient().checkNotifySign(body);
}
