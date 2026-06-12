import type { RequestHandler } from "express";
import { config } from "../lib/config.js";

export const requireLocalDevelopment: RequestHandler = (request, response, next) => {
  if (config.NODE_ENV === "production" || !config.ENABLE_DEV_PAYMENT) {
    response.status(404).json({
      error: {
        code: "ROUTE_NOT_FOUND",
        message: "API route not found",
      },
    });
    return;
  }

  const origin = request.get("origin");
  if (origin && !/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
    response.status(403).json({
      error: {
        code: "DEV_ORIGIN_FORBIDDEN",
        message: "Development payment is only available from the local frontend",
      },
    });
    return;
  }

  response.setHeader("Cache-Control", "no-store");
  next();
};
