import { chatPrompt } from "../prompts/chatPrompt.js";
import { freeReportPrompt } from "../prompts/freeReportPrompt.js";
import { fullReportPrompt } from "../prompts/fullReportPrompt.js";
import { gaokaoDecisionSkill } from "../prompts/gaokaoDecisionSkill.js";
import type { ChatMessageRecord, UserProfile } from "../types/index.js";

export function buildFreeReportMessages(profile: UserProfile) {
  return [
    { role: "system" as const, content: gaokaoDecisionSkill },
    { role: "user" as const, content: freeReportPrompt(profile) },
  ];
}

export function buildFullReportMessages(profile: UserProfile, freeReport: unknown) {
  return [
    { role: "system" as const, content: gaokaoDecisionSkill },
    { role: "user" as const, content: fullReportPrompt(profile, freeReport) },
  ];
}

export function buildChatMessages(input: {
  profile: UserProfile;
  freeReport: unknown;
  fullReport: unknown;
  history: ChatMessageRecord[];
  question: string;
}) {
  return [
    { role: "system" as const, content: gaokaoDecisionSkill },
    { role: "user" as const, content: chatPrompt(input) },
  ];
}
