import type {
  ChatMessage,
  ChatSession,
  FreeReport,
  FullReport,
  UserProfile,
} from "../types";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001"
).replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 500, code = "API_ERROR") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 90_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      throw new ApiError(
        payload?.error?.message ?? "服务暂时不可用，请稍后重试",
        response.status,
        payload?.error?.code ?? "API_ERROR",
      );
    }
    return payload as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("AI 分析等待超时，请点击重试", 408, "REQUEST_TIMEOUT");
    }
    throw new ApiError("无法连接分析服务，请确认后端已启动", 0, "NETWORK_ERROR");
  } finally {
    window.clearTimeout(timer);
  }
}

export async function saveProfile(profile: UserProfile) {
  return request<{ profileId: string }>("/api/profiles", {
    method: "POST",
    body: JSON.stringify(profile),
  });
}

export async function generateFreeReport(profileId: string) {
  return request<{ reportId: string; freeReport: FreeReport }>(
    "/api/reports/free",
    {
      method: "POST",
      body: JSON.stringify({ profileId }),
    },
    180_000,
  );
}

export async function createOrder(profileId: string, reportId: string) {
  return request<PaymentInitialization>("/api/orders", {
    method: "POST",
    body: JSON.stringify({ profileId, reportId }),
  });
}

export type PaymentInitialization = {
  orderId: string;
  status: "pending" | "paid" | "failed" | "refunded";
  paymentMode: "wechat_native" | "development";
  codeUrl: string | null;
};

export async function initializeOrderPayment(orderId: string) {
  return request<PaymentInitialization>(`/api/orders/${orderId}/payment`, {
    method: "POST",
  });
}

export async function getOrderPaymentStatus(orderId: string) {
  return request<{
    orderId: string;
    reportId: string;
    status: "pending" | "paid" | "failed" | "refunded";
    paymentMode: "wechat_native" | "development";
    paidAt: string | null;
  }>(`/api/orders/${orderId}`);
}

export async function markOrderPaid(orderId: string) {
  return request<{ order: { id: string; status: string } }>(
    `/api/dev/orders/${orderId}/mark-paid`,
    { method: "POST" },
  );
}

export async function generateFullReport(reportId: string) {
  return request<{ reportId: string; fullReport: FullReport }>(
    "/api/reports/full",
    {
      method: "POST",
      body: JSON.stringify({ reportId }),
    },
    180_000,
  );
}

export async function getReport(reportId: string) {
  return request<{
    reportId: string;
    freeReport: FreeReport | null;
    fullReport: FullReport | null;
    locked: boolean;
  }>(`/api/reports/${reportId}`);
}

export async function createChatSession(reportId: string) {
  return request<{
    chatSessionId: string;
    messageLimit: number;
    usedMessages: number;
  }>("/api/chat/session", {
    method: "POST",
    body: JSON.stringify({ reportId }),
  });
}

export async function getChatSessionsByReport(reportId: string) {
  return request<{ sessions: ChatSession[] }>(`/api/chat/by-report/${reportId}`);
}

export async function getChatMessages(chatSessionId: string) {
  return request<{ messages: ChatMessage[] }>(
    `/api/chat/session/${chatSessionId}/messages`,
  );
}

export async function sendChatMessage(chatSessionId: string, message: string) {
  return request<{
    reply: string;
    usedMessages: number;
    remainingMessages: number;
  }>(
    "/api/chat/message",
    {
      method: "POST",
      body: JSON.stringify({ chatSessionId, message }),
    },
    180_000,
  );
}

export function validateReportCompliance(report: unknown): boolean {
  const forbidden = ["保证录取", "100%不滑档", "内部数据", "一定能上", "必然就业"];
  return !forbidden.some((term) => JSON.stringify(report).includes(term));
}
