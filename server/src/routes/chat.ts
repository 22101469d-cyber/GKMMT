import { Router } from "express";
import { asyncRoute } from "../lib/asyncRoute.js";
import {
  chatSessionParamSchema,
  createChatSessionSchema,
  reportParamSchema,
  sendChatMessageSchema,
} from "../schemas/chatSchema.js";
import {
  createChatSession,
  getChatMessages,
  getChatSessionsByReport,
  sendChatMessage,
} from "../services/chatService.js";

export const chatRoutes = Router();

chatRoutes.post(
  "/session",
  asyncRoute(async (request, response) => {
    const { reportId } = createChatSessionSchema.parse(request.body);
    response.status(201).json(await createChatSession(reportId));
  }),
);

chatRoutes.post(
  "/message",
  asyncRoute(async (request, response) => {
    const { chatSessionId, message } = sendChatMessageSchema.parse(request.body);
    response.json(await sendChatMessage(chatSessionId, message));
  }),
);

chatRoutes.get(
  "/session/:chatSessionId/messages",
  asyncRoute(async (request, response) => {
    const { chatSessionId } = chatSessionParamSchema.parse(request.params);
    response.json({ messages: await getChatMessages(chatSessionId) });
  }),
);

chatRoutes.get(
  "/by-report/:reportId",
  asyncRoute(async (request, response) => {
    const { reportId } = reportParamSchema.parse(request.params);
    response.json({ sessions: await getChatSessionsByReport(reportId) });
  }),
);
