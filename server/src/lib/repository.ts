import { randomUUID } from "node:crypto";
import type { ProfileInput } from "../schemas/profileSchema.js";
import type {
  ChatMessageRecord,
  ChatSessionRecord,
  OrderRecord,
  ReportRecord,
  UsageLimitRecord,
  UserProfile,
} from "../types/index.js";
import { config } from "./config.js";
import { HttpError } from "./httpError.js";
import { supabase } from "./supabase.js";

interface AdminLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: string;
}

export interface Repository {
  createProfile(input: ProfileInput): Promise<UserProfile>;
  getProfile(id: string): Promise<UserProfile | null>;
  createFreeReport(profileId: string, report: unknown, modelUsed: string): Promise<ReportRecord>;
  getReport(id: string): Promise<ReportRecord | null>;
  updateFullReport(id: string, report: unknown, modelUsed: string): Promise<ReportRecord>;
  listReports(): Promise<ReportRecord[]>;
  createOrder(input: {
    profileId: string;
    reportId: string;
    amount: number;
    paymentMethod?: string;
  }): Promise<OrderRecord>;
  getPaidOrderByReport(reportId: string): Promise<OrderRecord | null>;
  getOrder(id: string): Promise<OrderRecord | null>;
  updateOrderTransactionNote(id: string, note: string): Promise<OrderRecord>;
  markOrderPaid(id: string, transactionNote?: string): Promise<OrderRecord>;
  listOrders(): Promise<OrderRecord[]>;
  createAdminLog(input: Omit<AdminLog, "id" | "createdAt">): Promise<void>;
  ensureUsageLimit(order: OrderRecord): Promise<UsageLimitRecord>;
  getUsageLimit(orderId: string): Promise<UsageLimitRecord | null>;
  consumeChatMessage(orderId: string): Promise<UsageLimitRecord>;
  createChatSession(input: {
    profileId: string;
    reportId: string;
    orderId: string;
    title: string;
  }): Promise<ChatSessionRecord>;
  getChatSession(id: string): Promise<ChatSessionRecord | null>;
  listChatSessionsByReport(reportId: string): Promise<ChatSessionRecord[]>;
  createChatMessage(input: {
    chatSessionId: string;
    role: ChatMessageRecord["role"];
    content: string;
  }): Promise<ChatMessageRecord>;
  listChatMessages(sessionId: string, limit?: number): Promise<ChatMessageRecord[]>;
}

function now() {
  return new Date().toISOString();
}

function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: String(row.id),
    careerDirection: String(row.career_direction),
    priority: String(row.priority),
    longTermStudy: String(row.long_term_study),
    cityPreference: String(row.city_preference),
    riskPreference: String(row.risk_preference),
    province: String(row.province),
    subjectType: String(row.subject_type),
    score: row.score === null ? null : String(row.score ?? ""),
    rank: row.rank === null ? null : String(row.rank ?? ""),
    createdAt: String(row.created_at),
  };
}

function mapReport(row: Record<string, unknown>): ReportRecord {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    freeReport: row.free_report ?? null,
    fullReport: row.full_report ?? null,
    status: row.status as ReportRecord["status"],
    modelUsed: row.model_used === null ? null : String(row.model_used ?? ""),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapOrder(row: Record<string, unknown>): OrderRecord {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    reportId: String(row.report_id),
    amount: Number(row.amount),
    status: row.status as OrderRecord["status"],
    paymentMethod: String(row.payment_method),
    transactionNote:
      row.transaction_note === null ? null : String(row.transaction_note ?? ""),
    paidAt: row.paid_at === null ? null : String(row.paid_at ?? ""),
    createdAt: String(row.created_at),
  };
}

function mapSession(row: Record<string, unknown>): ChatSessionRecord {
  return {
    id: String(row.id),
    profileId: String(row.profile_id),
    reportId: String(row.report_id),
    orderId: String(row.order_id),
    title: row.title === null ? null : String(row.title ?? ""),
    status: row.status as ChatSessionRecord["status"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): ChatMessageRecord {
  return {
    id: String(row.id),
    chatSessionId: String(row.chat_session_id),
    role: row.role as ChatMessageRecord["role"],
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

function mapUsage(row: Record<string, unknown>): UsageLimitRecord {
  return {
    id: String(row.id),
    orderId: String(row.order_id),
    profileId: String(row.profile_id),
    reportId: String(row.report_id),
    chatMessageLimit: Number(row.chat_message_limit),
    usedChatMessages: Number(row.used_chat_messages),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

class MemoryRepository implements Repository {
  private profiles = new Map<string, UserProfile>();
  private reports = new Map<string, ReportRecord>();
  private orders = new Map<string, OrderRecord>();
  private sessions = new Map<string, ChatSessionRecord>();
  private messages = new Map<string, ChatMessageRecord>();
  private usage = new Map<string, UsageLimitRecord>();
  private adminLogs = new Map<string, AdminLog>();

  async createProfile(input: ProfileInput) {
    const createdAt = now();
    const profile: UserProfile = {
      id: randomUUID(),
      ...input,
      score: input.score || null,
      rank: input.rank || null,
      createdAt,
    };
    this.profiles.set(profile.id, profile);
    return profile;
  }

  async getProfile(id: string) {
    return this.profiles.get(id) ?? null;
  }

  async createFreeReport(profileId: string, report: unknown, modelUsed: string) {
    const timestamp = now();
    const record: ReportRecord = {
      id: randomUUID(),
      profileId,
      freeReport: report,
      fullReport: null,
      status: "free_generated",
      modelUsed,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.reports.set(record.id, record);
    return record;
  }

  async getReport(id: string) {
    return this.reports.get(id) ?? null;
  }

  async updateFullReport(id: string, report: unknown, modelUsed: string) {
    const current = this.reports.get(id);
    if (!current) throw new HttpError(404, "Report not found", "REPORT_NOT_FOUND");
    const updated: ReportRecord = {
      ...current,
      fullReport: report,
      status: "full_generated",
      modelUsed,
      updatedAt: now(),
    };
    this.reports.set(id, updated);
    return updated;
  }

  async listReports() {
    return [...this.reports.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createOrder(input: {
    profileId: string;
    reportId: string;
    amount: number;
    paymentMethod?: string;
  }) {
    const order: OrderRecord = {
      id: randomUUID(),
      ...input,
      status: "pending",
      paymentMethod: input.paymentMethod ?? "manual",
      transactionNote: null,
      paidAt: null,
      createdAt: now(),
    };
    this.orders.set(order.id, order);
    return order;
  }

  async getPaidOrderByReport(reportId: string) {
    return (
      [...this.orders.values()].find(
        (order) => order.reportId === reportId && order.status === "paid",
      ) ?? null
    );
  }

  async getOrder(id: string) {
    return this.orders.get(id) ?? null;
  }

  async updateOrderTransactionNote(id: string, note: string) {
    const current = this.orders.get(id);
    if (!current) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
    const updated = { ...current, transactionNote: note };
    this.orders.set(id, updated);
    return updated;
  }

  async markOrderPaid(id: string, transactionNote?: string) {
    const current = this.orders.get(id);
    if (!current) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
    const updated: OrderRecord = {
      ...current,
      status: "paid",
      transactionNote: transactionNote ?? current.transactionNote,
      paidAt: current.paidAt ?? now(),
    };
    this.orders.set(id, updated);
    return updated;
  }

  async listOrders() {
    return [...this.orders.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async createAdminLog(input: Omit<AdminLog, "id" | "createdAt">) {
    const log = { ...input, id: randomUUID(), createdAt: now() };
    this.adminLogs.set(log.id, log);
  }

  async ensureUsageLimit(order: OrderRecord) {
    const existing = this.usage.get(order.id);
    if (existing) return existing;
    const timestamp = now();
    const record: UsageLimitRecord = {
      id: randomUUID(),
      orderId: order.id,
      profileId: order.profileId,
      reportId: order.reportId,
      chatMessageLimit: 20,
      usedChatMessages: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.usage.set(order.id, record);
    return record;
  }

  async getUsageLimit(orderId: string) {
    return this.usage.get(orderId) ?? null;
  }

  async consumeChatMessage(orderId: string) {
    const current = this.usage.get(orderId);
    if (!current) throw new HttpError(404, "Usage limit not found", "USAGE_NOT_FOUND");
    if (current.usedChatMessages >= current.chatMessageLimit) {
      throw new HttpError(403, "Chat message limit exceeded", "CHAT_LIMIT_EXCEEDED");
    }
    const updated = {
      ...current,
      usedChatMessages: current.usedChatMessages + 1,
      updatedAt: now(),
    };
    this.usage.set(orderId, updated);
    return updated;
  }

  async createChatSession(input: {
    profileId: string;
    reportId: string;
    orderId: string;
    title: string;
  }) {
    const timestamp = now();
    const session: ChatSessionRecord = {
      id: randomUUID(),
      ...input,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async getChatSession(id: string) {
    return this.sessions.get(id) ?? null;
  }

  async listChatSessionsByReport(reportId: string) {
    return [...this.sessions.values()]
      .filter((session) => session.reportId === reportId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async createChatMessage(input: {
    chatSessionId: string;
    role: ChatMessageRecord["role"];
    content: string;
  }) {
    const message: ChatMessageRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now(),
    };
    this.messages.set(message.id, message);
    return message;
  }

  async listChatMessages(sessionId: string, limit?: number) {
    const records = [...this.messages.values()]
      .filter((message) => message.chatSessionId === sessionId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return limit ? records.slice(-limit) : records;
  }
}

class SupabaseRepository implements Repository {
  private get client() {
    if (!supabase) throw new Error("Supabase is not configured");
    return supabase;
  }

  private async unwrap<T>(promise: PromiseLike<{ data: T; error: { message: string } | null }>) {
    const { data, error } = await promise;
    if (error) throw new Error(error.message);
    return data;
  }

  async createProfile(input: ProfileInput) {
    const data = await this.unwrap(
      this.client
        .from("user_profiles")
        .insert({
          career_direction: input.careerDirection,
          priority: input.priority,
          long_term_study: input.longTermStudy,
          city_preference: input.cityPreference,
          risk_preference: input.riskPreference,
          province: input.province,
          subject_type: input.subjectType,
          score: input.score || null,
          rank: input.rank || null,
        })
        .select()
        .single(),
    );
    return mapProfile(data as Record<string, unknown>);
  }

  async getProfile(id: string) {
    const { data, error } = await this.client
      .from("user_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapProfile(data) : null;
  }

  async createFreeReport(profileId: string, report: unknown, modelUsed: string) {
    const data = await this.unwrap(
      this.client
        .from("reports")
        .insert({
          profile_id: profileId,
          free_report: report,
          status: "free_generated",
          model_used: modelUsed,
        })
        .select()
        .single(),
    );
    return mapReport(data as Record<string, unknown>);
  }

  async getReport(id: string) {
    const { data, error } = await this.client
      .from("reports")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapReport(data) : null;
  }

  async updateFullReport(id: string, report: unknown, modelUsed: string) {
    const data = await this.unwrap(
      this.client
        .from("reports")
        .update({
          full_report: report,
          status: "full_generated",
          model_used: modelUsed,
        })
        .eq("id", id)
        .select()
        .single(),
    );
    return mapReport(data as Record<string, unknown>);
  }

  async listReports() {
    const data = await this.unwrap(
      this.client.from("reports").select("*").order("created_at", { ascending: false }),
    );
    return (data as Record<string, unknown>[]).map(mapReport);
  }

  async createOrder(input: {
    profileId: string;
    reportId: string;
    amount: number;
    paymentMethod?: string;
  }) {
    const data = await this.unwrap(
      this.client
        .from("orders")
        .insert({
          profile_id: input.profileId,
          report_id: input.reportId,
          amount: input.amount,
          payment_method: input.paymentMethod ?? "manual",
          status: "pending",
        })
        .select()
        .single(),
    );
    return mapOrder(data as Record<string, unknown>);
  }

  async getPaidOrderByReport(reportId: string) {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("report_id", reportId)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOrder(data) : null;
  }

  async getOrder(id: string) {
    const { data, error } = await this.client
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOrder(data) : null;
  }

  async updateOrderTransactionNote(id: string, note: string) {
    const data = await this.unwrap(
      this.client
        .from("orders")
        .update({ transaction_note: note })
        .eq("id", id)
        .select()
        .single(),
    );
    return mapOrder(data as Record<string, unknown>);
  }

  async markOrderPaid(id: string, transactionNote?: string) {
    const current = await this.getOrder(id);
    if (!current) throw new HttpError(404, "Order not found", "ORDER_NOT_FOUND");
    if (current.status === "paid") return current;
    const data = await this.unwrap(
      this.client
        .from("orders")
        .update({
          status: "paid",
          paid_at: now(),
          transaction_note: transactionNote ?? current.transactionNote,
        })
        .eq("id", id)
        .select()
        .single(),
    );
    return mapOrder(data as Record<string, unknown>);
  }

  async listOrders() {
    const data = await this.unwrap(
      this.client.from("orders").select("*").order("created_at", { ascending: false }),
    );
    return (data as Record<string, unknown>[]).map(mapOrder);
  }

  async createAdminLog(input: Omit<AdminLog, "id" | "createdAt">) {
    await this.unwrap(
      this.client.from("admin_logs").insert({
        action: input.action,
        target_type: input.targetType,
        target_id: input.targetId,
        note: input.note,
      }),
    );
  }

  async ensureUsageLimit(order: OrderRecord) {
    const existing = await this.getUsageLimit(order.id);
    if (existing) return existing;
    const data = await this.unwrap(
      this.client
        .from("usage_limits")
        .insert({
          order_id: order.id,
          profile_id: order.profileId,
          report_id: order.reportId,
          chat_message_limit: 20,
        })
        .select()
        .single(),
    );
    return mapUsage(data as Record<string, unknown>);
  }

  async getUsageLimit(orderId: string) {
    const { data, error } = await this.client
      .from("usage_limits")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapUsage(data) : null;
  }

  async consumeChatMessage(orderId: string) {
    const { data, error } = await this.client.rpc("consume_chat_message", {
      p_order_id: orderId,
    });
    if (error) {
      if (error.message.includes("CHAT_LIMIT_EXCEEDED")) {
        throw new HttpError(403, "Chat message limit exceeded", "CHAT_LIMIT_EXCEEDED");
      }
      throw new Error(error.message);
    }
    const usage = await this.getUsageLimit(orderId);
    if (!usage || !data) throw new Error("Failed to consume chat usage");
    return usage;
  }

  async createChatSession(input: {
    profileId: string;
    reportId: string;
    orderId: string;
    title: string;
  }) {
    const data = await this.unwrap(
      this.client
        .from("chat_sessions")
        .insert({
          profile_id: input.profileId,
          report_id: input.reportId,
          order_id: input.orderId,
          title: input.title,
        })
        .select()
        .single(),
    );
    return mapSession(data as Record<string, unknown>);
  }

  async getChatSession(id: string) {
    const { data, error } = await this.client
      .from("chat_sessions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapSession(data) : null;
  }

  async listChatSessionsByReport(reportId: string) {
    const data = await this.unwrap(
      this.client
        .from("chat_sessions")
        .select("*")
        .eq("report_id", reportId)
        .order("updated_at", { ascending: false }),
    );
    return (data as Record<string, unknown>[]).map(mapSession);
  }

  async createChatMessage(input: {
    chatSessionId: string;
    role: ChatMessageRecord["role"];
    content: string;
  }) {
    const data = await this.unwrap(
      this.client
        .from("chat_messages")
        .insert({
          chat_session_id: input.chatSessionId,
          role: input.role,
          content: input.content,
        })
        .select()
        .single(),
    );
    return mapMessage(data as Record<string, unknown>);
  }

  async listChatMessages(sessionId: string, limit?: number) {
    let query = this.client
      .from("chat_messages")
      .select("*")
      .eq("chat_session_id", sessionId)
      .order("created_at", { ascending: false });
    if (limit) query = query.limit(limit);
    const data = await this.unwrap(query);
    return (data as Record<string, unknown>[]).map(mapMessage).reverse();
  }
}

export const repository: Repository = config.USE_MOCK_DATABASE
  ? new MemoryRepository()
  : new SupabaseRepository();
