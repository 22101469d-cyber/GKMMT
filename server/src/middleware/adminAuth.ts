import { timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { config } from "../lib/config.js";

function secureEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export const requireAdmin: RequestHandler = (request, response, next) => {
  if (!config.ADMIN_API_KEY) {
    response.status(503).json({
      error: {
        code: "ADMIN_NOT_CONFIGURED",
        message: "Administrator access is not configured",
      },
    });
    return;
  }

  const authorization = request.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token || !secureEqual(token, config.ADMIN_API_KEY)) {
    response.status(401).json({
      error: {
        code: "ADMIN_UNAUTHORIZED",
        message: "Administrator credentials are required",
      },
    });
    return;
  }

  response.setHeader("Cache-Control", "no-store");
  next();
};
