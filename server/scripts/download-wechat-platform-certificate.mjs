import "dotenv/config";
import {
  createDecipheriv,
  createSign,
  randomBytes,
} from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "WECHAT_PAY_MCH_ID",
  "WECHAT_PAY_MCH_SERIAL_NO",
  "WECHAT_PAY_PRIVATE_KEY_PATH",
  "WECHAT_PAY_API_V3_KEY",
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required`);
}

const path = "/v3/certificates";
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = randomBytes(16).toString("hex");
const message = `GET\n${path}\n${timestamp}\n${nonce}\n\n`;
const privateKey = readFileSync(
  resolve(process.cwd(), process.env.WECHAT_PAY_PRIVATE_KEY_PATH),
  "utf8",
);
const signature = createSign("RSA-SHA256")
  .update(message)
  .end()
  .sign(privateKey, "base64");
const authorization = [
  `WECHATPAY2-SHA256-RSA2048 mchid="${process.env.WECHAT_PAY_MCH_ID}"`,
  `nonce_str="${nonce}"`,
  `timestamp="${timestamp}"`,
  `serial_no="${process.env.WECHAT_PAY_MCH_SERIAL_NO}"`,
  `signature="${signature}"`,
].join(",");

const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
  headers: {
    Accept: "application/json",
    "Accept-Language": "zh-CN",
    Authorization: authorization,
    "User-Agent": "FuturePathAI-CertificateDownloader/1.0",
  },
});
const body = await response.json();
if (!response.ok) {
  throw new Error(body.message ?? "Failed to download WeChat Pay certificates");
}

function decrypt(resource) {
  const encrypted = Buffer.from(resource.ciphertext, "base64");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    Buffer.from(process.env.WECHAT_PAY_API_V3_KEY),
    Buffer.from(resource.nonce),
  );
  decipher.setAuthTag(encrypted.subarray(encrypted.length - 16));
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data));
  }
  return Buffer.concat([
    decipher.update(encrypted.subarray(0, encrypted.length - 16)),
    decipher.final(),
  ]).toString("utf8");
}

const certificate = body.data
  .map((item) => ({ ...item, pem: decrypt(item.encrypt_certificate) }))
  .sort((a, b) => b.expire_time.localeCompare(a.expire_time))[0];
if (!certificate) throw new Error("WeChat Pay returned no platform certificate");

const outputPath = resolve(
  process.cwd(),
  "certs/wechatpay_platform_certificate.pem",
);
writeFileSync(outputPath, certificate.pem, { mode: 0o600 });
console.log(JSON.stringify({
  serialNo: certificate.serial_no,
  effectiveTime: certificate.effective_time,
  expireTime: certificate.expire_time,
  outputPath,
}, null, 2));
