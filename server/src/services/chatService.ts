import { HttpError } from "../lib/httpError.js";
import { repository } from "../lib/repository.js";
import { generateChatReplyWithAI } from "./aiService.js";
import { sanitizeCompliance } from "./complianceService.js";

export async function createChatSession(reportId: string) {
  const [report, order] = await Promise.all([
    repository.getReport(reportId),
    repository.getPaidOrderByReport(reportId),
  ]);
  if (!report) throw new HttpError(404, "Report not found", "REPORT_NOT_FOUND");
  if (!order) {
    throw new HttpError(403, "A paid order is required for chat", "PAYMENT_REQUIRED");
  }
  if (!report.fullReport) {
    throw new HttpError(
      409,
      "Generate the full report before starting chat",
      "FULL_REPORT_REQUIRED",
    );
  }
  const usage = await repository.ensureUsageLimit(order);
  const session = await repository.createChatSession({
    profileId: report.profileId,
    reportId: report.id,
    orderId: order.id,
    title: "高考志愿报告追问",
  });
  return {
    chatSessionId: session.id,
    messageLimit: usage.chatMessageLimit,
    usedMessages: usage.usedChatMessages,
  };
}

export async function sendChatMessage(chatSessionId: string, question: string) {
  const session = await repository.getChatSession(chatSessionId);
  if (!session) {
    throw new HttpError(404, "Chat session not found", "CHAT_SESSION_NOT_FOUND");
  }
  const [order, usage, profile, report] = await Promise.all([
    repository.getOrder(session.orderId),
    repository.getUsageLimit(session.orderId),
    repository.getProfile(session.profileId),
    repository.getReport(session.reportId),
  ]);
  if (!order || order.status !== "paid") {
    throw new HttpError(403, "A paid order is required for chat", "PAYMENT_REQUIRED");
  }
  if (!usage) throw new HttpError(409, "Usage limit is missing", "USAGE_NOT_FOUND");
  if (usage.usedChatMessages >= usage.chatMessageLimit) {
    throw new HttpError(403, "Chat message limit exceeded", "CHAT_LIMIT_EXCEEDED");
  }
  if (!profile || !report?.freeReport || !report.fullReport) {
    throw new HttpError(409, "Report context is incomplete", "REPORT_CONTEXT_INCOMPLETE");
  }

  await repository.createChatMessage({
    chatSessionId,
    role: "user",
    content: question,
  });
  const history = await repository.listChatMessages(chatSessionId, 10);
  const rawReply = await generateChatReplyWithAI({
    profile,
    freeReport: report.freeReport,
    fullReport: report.fullReport,
    history,
    question,
  });
  const reply = sanitizeCompliance(rawReply);
  const consumed = await repository.consumeChatMessage(order.id);
  await repository.createChatMessage({
    chatSessionId,
    role: "assistant",
    content: reply,
  });

  return {
    reply,
    usedMessages: consumed.usedChatMessages,
    remainingMessages:
      consumed.chatMessageLimit - consumed.usedChatMessages,
  };
}

export async function getChatMessages(chatSessionId: string) {
  const session = await repository.getChatSession(chatSessionId);
  if (!session) {
    throw new HttpError(404, "Chat session not found", "CHAT_SESSION_NOT_FOUND");
  }
  const order = await repository.getOrder(session.orderId);
  if (!order || order.status !== "paid") {
    throw new HttpError(403, "A paid order is required for chat", "PAYMENT_REQUIRED");
  }
  const messages = await repository.listChatMessages(chatSessionId);
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  }));
}

export async function getChatSessionsByReport(reportId: string) {
  const order = await repository.getPaidOrderByReport(reportId);
  if (!order) {
    throw new HttpError(403, "A paid order is required for chat", "PAYMENT_REQUIRED");
  }
  return repository.listChatSessionsByReport(reportId);
}
