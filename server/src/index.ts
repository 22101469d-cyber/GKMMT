import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from "express";
import helmet from "helmet";
import { ZodError } from "zod";
import { adminRoutes } from "./routes/admin.js";
import { devRoutes } from "./routes/dev.js";
import { chatRoutes } from "./routes/chat.js";
import { ordersRoutes } from "./routes/orders.js";
import { profilesRoutes } from "./routes/profiles.js";
import { reportsRoutes } from "./routes/reports.js";
import { paymentsRoutes } from "./routes/payments.js";
import { config } from "./lib/config.js";
import { HttpError } from "./lib/httpError.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
const allowedOrigins = new Set([config.FRONTEND_ORIGIN]);
app.use(
  cors({
    origin(origin, callback) {
      const isLocalDevelopment =
        config.NODE_ENV !== "production" &&
        Boolean(origin?.match(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/));
      if (!origin || allowedOrigins.has(origin) || isLocalDevelopment) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin is not allowed"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(
  express.json({
    limit: "256kb",
    verify: (request, _response, buffer) => {
      (request as typeof request & { rawBody?: string }).rawBody = buffer.toString("utf8");
    },
  }),
);

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    database: config.USE_MOCK_DATABASE ? "memory" : "supabase",
    payment: config.WECHAT_PAY_ENABLED ? "wechat_native" : "development",
    ai:
      config.AI_PROVIDER === "gemini"
        ? config.GEMINI_MODEL
        : config.AI_PROVIDER === "openrouter"
          ? config.OPENROUTER_MODEL
        : config.AI_PROVIDER === "openai"
          ? config.OPENAI_MODEL
          : "mock",
  });
});

app.use("/api/profiles", profilesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dev", devRoutes);
app.use("/api/chat", chatRoutes);

const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "API route not found",
    },
  });
};
app.use(notFound);

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
      },
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "The server could not complete the request",
    },
  });
};
app.use(errorHandler);

app.listen(config.PORT, () => {
  console.log(
    `Future Path AI server listening on http://localhost:${config.PORT} (${config.USE_MOCK_DATABASE ? "memory" : "supabase"}, ${config.AI_PROVIDER === "gemini" ? config.GEMINI_MODEL : config.AI_PROVIDER === "openrouter" ? config.OPENROUTER_MODEL : config.AI_PROVIDER === "openai" ? config.OPENAI_MODEL : "mock-ai"})`,
  );
});
