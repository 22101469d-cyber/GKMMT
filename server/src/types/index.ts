export interface UserProfile {
  id: string;
  careerDirection: string;
  priority: string;
  longTermStudy: string;
  cityPreference: string;
  riskPreference: string;
  province: string;
  subjectType: string;
  score: string | null;
  rank: string | null;
  createdAt: string;
}

export interface ReportRecord {
  id: string;
  profileId: string;
  freeReport: unknown | null;
  fullReport: unknown | null;
  status: "free_generated" | "full_generated" | "failed";
  modelUsed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRecord {
  id: string;
  profileId: string;
  reportId: string;
  amount: number;
  status: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: string;
  transactionNote: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface ChatSessionRecord {
  id: string;
  profileId: string;
  reportId: string;
  orderId: string;
  title: string | null;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageRecord {
  id: string;
  chatSessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface UsageLimitRecord {
  id: string;
  orderId: string;
  profileId: string;
  reportId: string;
  chatMessageLimit: number;
  usedChatMessages: number;
  createdAt: string;
  updatedAt: string;
}
