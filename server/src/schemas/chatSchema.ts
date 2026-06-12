import { z } from "zod";

export const createChatSessionSchema = z.object({
  reportId: z.string().uuid(),
});

export const sendChatMessageSchema = z.object({
  chatSessionId: z.string().uuid(),
  message: z.string().trim().min(1).max(3000),
});

export const chatSessionParamSchema = z.object({
  chatSessionId: z.string().uuid(),
});

export const reportParamSchema = z.object({
  reportId: z.string().uuid(),
});
