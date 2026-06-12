import {
  createDecipheriv,
  createSign,
  createVerify,
  randomBytes,
} from "node:crypto";
import { readFileSync } from "node:fs";
import { config } from "./config.js";
import { HttpError } from "./httpError.js";

const apiBase = "https://api.mch.weixin.qq.com";
let merchantPrivateKey: string | undefined;
let platformPublicKey: string | undefined;

function loadMerchantPrivateKey() {
  merchantPrivateKey ??= config.WECHAT_PAY_PRIVATE_KEY_PEM
    ? config.WECHAT_PAY_PRIVATE_KEY_PEM.replaceAll("\\n", "\n")
    : readFileSync(config.WECHAT_PAY_PRIVATE_KEY_PATH, "utf8");
  return merchantPrivateKey;
}

function loadPlatformPublicKey() {
  platformPublicKey ??= config.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM
    ? config.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM.replaceAll("\\n", "\n")
    : readFileSync(
      config.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH,
      "utf8",
    );
  return platformPublicKey;
}

function nonce() {
  return randomBytes(16).toString("hex");
}

function signMessage(message: string) {
  return createSign("RSA-SHA256")
    .update(message)
    .end()
    .sign(loadMerchantPrivateKey(), "base64");
}

function verifyPlatformSignature(input: {
  timestamp: string;
  nonce: string;
  body: string;
  signature: string;
  serial: string;
}) {
  if (input.serial !== config.WECHAT_PAY_PLATFORM_SERIAL_NO) {
    throw new HttpError(
      401,
      `Unknown WeChat Pay platform key: ${input.serial || "missing"}`,
      "WECHAT_SERIAL_MISMATCH",
    );
  }
  const message = `${input.timestamp}\n${input.nonce}\n${input.body}\n`;
  return createVerify("RSA-SHA256")
    .update(message)
    .end()
    .verify(loadPlatformPublicKey(), input.signature, "base64");
}

function authorization(method: string, path: string, body: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonceStr = nonce();
  const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`;
  const signature = signMessage(message);
  return [
    'WECHATPAY2-SHA256-RSA2048 mchid="' + config.WECHAT_PAY_MCH_ID + '"',
    'nonce_str="' + nonceStr + '"',
    'timestamp="' + timestamp + '"',
    'serial_no="' + config.WECHAT_PAY_MCH_SERIAL_NO + '"',
    'signature="' + signature + '"',
  ].join(",");
}

async function wechatRequest<T>(method: "GET" | "POST", path: string, payload?: unknown) {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      "Accept-Language": "zh-CN",
      "Content-Type": "application/json",
      Authorization: authorization(method, path, body),
      "User-Agent": "FuturePathAI/1.0",
    },
    body: method === "POST" ? body : undefined,
  });
  const responseBody = await response.text();
  const timestamp = response.headers.get("wechatpay-timestamp") ?? "";
  const nonceStr = response.headers.get("wechatpay-nonce") ?? "";
  const signature = response.headers.get("wechatpay-signature") ?? "";
  const serial = response.headers.get("wechatpay-serial") ?? "";
  if (
    !timestamp ||
    !nonceStr ||
    !signature ||
    !serial ||
    !verifyPlatformSignature({
      timestamp,
      nonce: nonceStr,
      body: responseBody,
      signature,
      serial,
    })
  ) {
    throw new HttpError(502, "Invalid WeChat Pay response signature", "WECHAT_SIGNATURE_INVALID");
  }
  if (!response.ok) {
    let message = "WeChat Pay request failed";
    try {
      const parsed = JSON.parse(responseBody) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      // Keep the generic error when WeChat returns a non-JSON failure.
    }
    throw new HttpError(502, message, "WECHAT_REQUEST_FAILED");
  }
  return JSON.parse(responseBody) as T;
}

export function toWechatOutTradeNo(orderId: string) {
  return orderId.replaceAll("-", "");
}

export function fromWechatOutTradeNo(outTradeNo: string) {
  if (!/^[0-9a-f]{32}$/i.test(outTradeNo)) {
    throw new HttpError(400, "Invalid merchant order number", "WECHAT_ORDER_INVALID");
  }
  return [
    outTradeNo.slice(0, 8),
    outTradeNo.slice(8, 12),
    outTradeNo.slice(12, 16),
    outTradeNo.slice(16, 20),
    outTradeNo.slice(20),
  ].join("-");
}

export async function createWechatNativePayment(order: {
  id: string;
  amount: number;
}) {
  return wechatRequest<{ code_url: string }>("POST", "/v3/pay/transactions/native", {
    appid: config.WECHAT_PAY_APP_ID,
    mchid: config.WECHAT_PAY_MCH_ID,
    description: "序航AI高考志愿完整分析报告",
    out_trade_no: toWechatOutTradeNo(order.id),
    notify_url: config.WECHAT_PAY_NOTIFY_URL,
    amount: {
      total: order.amount,
      currency: "CNY",
    },
  });
}

export function verifyWechatNotification(headers: {
  timestamp: string;
  nonce: string;
  signature: string;
  serial: string;
}, rawBody: string) {
  const timestamp = Number(headers.timestamp);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) {
    throw new HttpError(401, "Expired WeChat Pay notification", "WECHAT_NOTIFY_EXPIRED");
  }
  if (!verifyPlatformSignature({ ...headers, body: rawBody })) {
    throw new HttpError(401, "Invalid WeChat Pay notification", "WECHAT_NOTIFY_INVALID");
  }
}

export function decryptWechatResource(resource: {
  ciphertext: string;
  nonce: string;
  associated_data?: string;
}) {
  const encrypted = Buffer.from(resource.ciphertext, "base64");
  const authTag = encrypted.subarray(encrypted.length - 16);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(config.WECHAT_PAY_API_V3_KEY),
    Buffer.from(resource.nonce),
  );
  decipher.setAuthTag(authTag);
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString("utf8")) as {
    mchid: string;
    appid: string;
    out_trade_no: string;
    transaction_id: string;
    trade_state: string;
    amount: { total: number; payer_total?: number; currency: string };
  };
}
