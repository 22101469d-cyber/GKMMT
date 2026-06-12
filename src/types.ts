export interface UserProfile {
  careerDirection: string;
  priority: string;
  longTermStudy: string;
  cityPreference: string;
  riskPreference: string;
  province: string;
  subjectType: string;
  score: string;
  rank?: string;
}

export interface FreeReport {
  profileType: string;
  matchScore: number;
  summary: string;
  risks: string[];
  recommendedFields: string[];
  parentSummary: string;
  disclaimer: string;
}

export interface MajorAdvice {
  name: string;
  fit: "高" | "中高" | "中";
  reason: string;
  risk: string;
}

export interface FullReport {
  profileType: string;
  matchScore: number;
  summary: string;
  coreConflict: string;
  recommendedMajors: MajorAdvice[];
  cautiousMajors: Array<{
    name: string;
    riskLevel: string;
    reason: string;
    whenToConsider: string;
  }>;
  rankStrategy: {
    summary: string;
    chong: string;
    wen: string;
    bao: string;
  };
  pathAnalysis: {
    postgraduate: string;
    civilService: string;
    employment: string;
  };
  familyAdvice: string;
  parentSummary: string;
  disclaimer: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  reportId: string;
  createdAt: string;
}
