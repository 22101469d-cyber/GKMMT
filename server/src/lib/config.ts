import "dotenv/config";
import { z } from "zod";

const booleanString = z
  .enum(["true", "false"])
  .default("true")
  .transform((value) => value === "true");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  FRONTEND_ORIGIN: z.string().url().default("http://localhost:5173"),
  ADMIN_API_KEY: z.string().optional().default(""),
  ENABLE_DEV_PAYMENT: z.enum(["true", "false"]).optional(),
  WECHAT_PAY_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  REPORT_PRICE_FEN: z.coerce.number().int().positive().max(1_000_000).default(1990),
  WECHAT_PAY_APP_ID: z.string().optional().default(""),
  WECHAT_PAY_MCH_ID: z.string().optional().default(""),
  WECHAT_PAY_MCH_SERIAL_NO: z.string().optional().default(""),
  WECHAT_PAY_PRIVATE_KEY_PATH: z.string().optional().default(""),
  WECHAT_PAY_PRIVATE_KEY_PEM: z.string().optional().default(""),
  WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH: z.string().optional().default(""),
  WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM: z.string().optional().default(""),
  WECHAT_PAY_PLATFORM_SERIAL_NO: z.string().optional().default(""),
  WECHAT_PAY_API_V3_KEY: z.string().optional().default(""),
  WECHAT_PAY_NOTIFY_URL: z.string().optional().default(""),
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_MODEL: z.string().min(1).default("gpt-4.1-mini"),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().min(1).default("gemini-3.1-flash-lite"),
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_MODEL: z.string().min(1).default("openrouter/free"),
  AI_PROVIDER: z
    .enum(["mock", "gemini", "openai", "openrouter"])
    .default("mock"),
  USE_MOCK_DATABASE: booleanString,
  USE_MOCK_AI: booleanString,
});

const parsedConfig = envSchema.parse(process.env);

export const config = {
  ...parsedConfig,
  ENABLE_DEV_PAYMENT:
    parsedConfig.ENABLE_DEV_PAYMENT === undefined
      ? parsedConfig.NODE_ENV !== "production"
      : parsedConfig.ENABLE_DEV_PAYMENT === "true",
};

if (config.NODE_ENV === "production") {
  if (config.ENABLE_DEV_PAYMENT) {
    throw new Error("ENABLE_DEV_PAYMENT must be false in production");
  }
  if (config.ADMIN_API_KEY.length < 32) {
    throw new Error("ADMIN_API_KEY must contain at least 32 characters in production");
  }
}

if (config.WECHAT_PAY_ENABLED) {
  const missing = [
    ["WECHAT_PAY_APP_ID", config.WECHAT_PAY_APP_ID],
    ["WECHAT_PAY_MCH_ID", config.WECHAT_PAY_MCH_ID],
    ["WECHAT_PAY_MCH_SERIAL_NO", config.WECHAT_PAY_MCH_SERIAL_NO],
    [
      "WECHAT_PAY_PRIVATE_KEY_PATH or WECHAT_PAY_PRIVATE_KEY_PEM",
      config.WECHAT_PAY_PRIVATE_KEY_PATH || config.WECHAT_PAY_PRIVATE_KEY_PEM,
    ],
    [
      "WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH or WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM",
      config.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PATH || config.WECHAT_PAY_PLATFORM_PUBLIC_KEY_PEM,
    ],
    ["WECHAT_PAY_PLATFORM_SERIAL_NO", config.WECHAT_PAY_PLATFORM_SERIAL_NO],
    ["WECHAT_PAY_API_V3_KEY", config.WECHAT_PAY_API_V3_KEY],
    ["WECHAT_PAY_NOTIFY_URL", config.WECHAT_PAY_NOTIFY_URL],
  ].filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    throw new Error(`Missing WeChat Pay configuration: ${missing.join(", ")}`);
  }
  if (Buffer.byteLength(config.WECHAT_PAY_API_V3_KEY) !== 32) {
    throw new Error("WECHAT_PAY_API_V3_KEY must be exactly 32 bytes");
  }
  if (!config.WECHAT_PAY_NOTIFY_URL.startsWith("https://")) {
    throw new Error("WECHAT_PAY_NOTIFY_URL must use HTTPS");
  }
}

if (!config.USE_MOCK_DATABASE && (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required when USE_MOCK_DATABASE=false",
  );
}

if (config.AI_PROVIDER === "openai" && !config.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required when USE_MOCK_AI=false");
}

if (config.AI_PROVIDER === "gemini" && !config.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is required when AI_PROVIDER=gemini");
}

if (config.AI_PROVIDER === "openrouter" && !config.OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter");
}
