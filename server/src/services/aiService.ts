import { zodTextFormat } from "openai/helpers/zod";
import { config } from "../lib/config.js";
import { generateWithGemini } from "../lib/gemini.js";
import { openai } from "../lib/openai.js";
import { generateOpenRouterText } from "../lib/openrouter.js";
import {
  freeReportSchema,
  fullReportSchema,
  type FreeReport,
  type FullReport,
} from "../schemas/reportSchema.js";
import type { ChatMessageRecord, UserProfile } from "../types/index.js";
import {
  buildChatMessages,
  buildFreeReportMessages,
  buildFullReportMessages,
} from "./skillService.js";

const disclaimer =
  "本报告由 AI 根据用户填写信息和公开信息生成，仅供志愿填报方向性参考，不构成录取承诺。最终应结合各省考试院、院校招生章程、当年招生计划和一分一段表判断。";

function mockFreeReport(profile: UserProfile): FreeReport {
  return {
    profileType:
      profile.riskPreference === "稳妥优先"
        ? "稳健路径优先型"
        : "路径平衡决策型",
    matchScore: profile.rank ? 86 : 78,
    summary:
      "建议先从职业出口和培养成本筛选专业方向，再用学校层次与城市资源做第二轮平衡。",
    risks: [
      "只看学校名气，可能忽略专业出口与转专业限制。",
      "追逐短期热门方向，可能低估课程难度和行业波动。",
      profile.longTermStudy === "只想本科就业"
        ? "不计划继续深造，需要谨慎评估学历依赖较强的专业。"
        : "愿意长期学习，但仍需评估投入周期与家庭成本。",
    ],
    recommendedFields:
      profile.careerDirection === "医疗健康"
        ? ["医学技术与康复", "药学与制药", "公共卫生与健康管理"]
        : ["电气与能源系统", "财会与审计", "计算机与数据应用"],
    parentSummary:
      "先保留四年后出口较清晰、孩子也能完成学习投入的路径，再比较学校层次。",
    disclaimer,
  };
}

function mockFullReport(profile: UserProfile): FullReport {
  return {
    ...mockFreeReport(profile),
    coreConflict:
      "你希望获得较清晰的就业路径，同时控制试错成本。关键不是追逐专业名称，而是判断课程能力、学历门槛和岗位入口是否匹配。",
    recommendedMajors: [
      {
        name: "电气工程及其自动化",
        fit: "高",
        reason: "行业覆盖面较广，就业路径相对清晰。",
        risk: "数学和物理课程要求较高。",
      },
      {
        name: "计算机科学与技术",
        fit: "中高",
        reason: "技能迁移范围广，可形成可验证能力。",
        risk: "需要持续学习，行业变化较快。",
      },
      {
        name: "会计学",
        fit: "中高",
        reason: "岗位认知清晰，可延伸到审计和考公。",
        risk: "基础岗位竞争明显。",
      },
      {
        name: "审计学",
        fit: "中高",
        reason: "职业路径相对具体，适合重视稳定性的人。",
        risk: "证书和实习会明显影响出口。",
      },
      {
        name: "信息管理与信息系统",
        fit: "中",
        reason: "连接技术与业务，方向选择较灵活。",
        risk: "不同学校培养方案差异较大。",
      },
      {
        name: "能源与动力工程",
        fit: "中",
        reason: "可进入能源、制造和公共事业相关领域。",
        risk: "需核对学校优势方向和地域产业。",
      },
    ],
    cautiousMajors: [
      {
        name: "工商管理",
        riskLevel: "需评估",
        reason: "本科能力标签可能不够明确。",
        whenToConsider: "学校平台较强且主动积累实习时考虑。",
      },
      {
        name: "法学",
        riskLevel: "需评估",
        reason: "培养规模大，职业资格与学校平台影响明显。",
        whenToConsider: "愿意长期学习并了解法律职业路径时考虑。",
      },
      {
        name: "生物科学",
        riskLevel: "较高",
        reason: "本科直接对口岗位范围相对有限。",
        whenToConsider: "明确接受深造和科研训练时考虑。",
      },
      {
        name: "新设交叉专业",
        riskLevel: "需评估",
        reason: "名称与课程、岗位出口可能存在差距。",
        whenToConsider: "核对课程、师资和往届去向后考虑。",
      },
    ],
    rankStrategy: {
      summary: profile.rank
        ? "基于填写的预估位次，建议采用稳妥平衡策略，并在正式填报前用当年一分一段表重新校准。"
        : "由于缺少准确位次，本部分仅提供方向性建议；正式填报前需结合当年一分一段表重新分析。",
      chong: "可争取学校层次或城市资源，但专业不能完全不可接受。",
      wen: "以就业路径清晰、学校与城市较均衡的组合为主体。",
      bao: "保底不能只看录取概率，也要核对专业接受度与调剂规则。",
    },
    pathAnalysis: {
      postgraduate: "把考研作为能力放大器，不要作为逃避本科专业判断的默认选项。",
      civilService: "结合近年职位表核对专业代码与岗位覆盖面，以当年公告为准。",
      employment: "优先选择能形成可验证技能并提供实习入口的专业方向。",
    },
    familyAdvice:
      "普通家庭应优先规避高投入、低确定性、路径不清晰的选择，先核对培养成本与职业出口。",
    parentSummary:
      "这份建议用于把担心变成可核实的问题，最终方案仍需由孩子能力、家庭条件和官方信息共同决定。",
    disclaimer,
  };
}

function parseJsonObject(text: string): Record<string, unknown> {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI response did not contain JSON");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function text(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function textList(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
    : [];
}

function normalizeFreeReport(raw: Record<string, unknown>, profile: UserProfile): FreeReport {
  const fallback = mockFreeReport(profile);
  const risks = [...textList(raw.risks), ...fallback.risks].slice(0, 3);
  const recommendedFields = [
    ...textList(raw.recommendedFields),
    ...fallback.recommendedFields,
  ].slice(0, 3);
  const parsedScore = Number(raw.matchScore);
  return freeReportSchema.parse({
    profileType: text(raw.profileType, fallback.profileType),
    matchScore: Number.isFinite(parsedScore)
      ? Math.round(Math.min(100, Math.max(0, parsedScore)))
      : fallback.matchScore,
    summary: text(raw.summary, fallback.summary),
    risks,
    recommendedFields,
    parentSummary: text(raw.parentSummary, fallback.parentSummary),
    disclaimer: text(raw.disclaimer, fallback.disclaimer),
  });
}

function normalizeFullReport(raw: Record<string, unknown>, profile: UserProfile): FullReport {
  const fallback = mockFullReport(profile);
  const majors = Array.isArray(raw.recommendedMajors)
    ? raw.recommendedMajors.map((item) => {
        const major = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          name: text(major.name, ""),
          fit: text(major.fit, "中"),
          reason: text(major.reason, "需结合课程与就业出口进一步核对。"),
          risk: text(major.risk, "需核对目标院校培养方案。"),
        };
      }).filter((major) => major.name)
    : [];
  const cautious = Array.isArray(raw.cautiousMajors)
    ? raw.cautiousMajors.map((item) => {
        const major = item && typeof item === "object" ? item as Record<string, unknown> : {};
        return {
          name: text(major.name, ""),
          riskLevel: text(major.riskLevel ?? major.level, "需评估"),
          reason: text(major.reason, "当前信息不足，需要进一步核对。"),
          whenToConsider: text(
            major.whenToConsider ?? major.condition,
            "确认课程适配、培养成本和就业出口后再考虑。",
          ),
        };
      }).filter((major) => major.name)
    : [];
  const rank = raw.rankStrategy && typeof raw.rankStrategy === "object"
    ? raw.rankStrategy as Record<string, unknown>
    : {};
  const paths = raw.pathAnalysis && typeof raw.pathAnalysis === "object"
    ? raw.pathAnalysis as Record<string, unknown>
    : {};
  const parsedScore = Number(raw.matchScore);
  return fullReportSchema.parse({
    profileType: text(raw.profileType, fallback.profileType),
    matchScore: Number.isFinite(parsedScore)
      ? Math.round(Math.min(100, Math.max(0, parsedScore)))
      : fallback.matchScore,
    summary: text(raw.summary, fallback.summary),
    coreConflict: text(raw.coreConflict ?? raw.contradiction, fallback.coreConflict),
    recommendedMajors: [...majors, ...fallback.recommendedMajors].slice(0, Math.max(6, majors.length)),
    cautiousMajors: [...cautious, ...fallback.cautiousMajors].slice(0, Math.max(4, cautious.length)),
    rankStrategy: {
      summary: text(rank.summary, fallback.rankStrategy.summary),
      chong: text(rank.chong, fallback.rankStrategy.chong),
      wen: text(rank.wen, fallback.rankStrategy.wen),
      bao: text(rank.bao, fallback.rankStrategy.bao),
    },
    pathAnalysis: {
      postgraduate: text(paths.postgraduate, fallback.pathAnalysis.postgraduate),
      civilService: text(paths.civilService, fallback.pathAnalysis.civilService),
      employment: text(paths.employment, fallback.pathAnalysis.employment),
    },
    familyAdvice: text(raw.familyAdvice, fallback.familyAdvice),
    parentSummary: text(raw.parentSummary, fallback.parentSummary),
    disclaimer: text(raw.disclaimer, fallback.disclaimer),
  });
}

export async function generateFreeReportWithAI(profile: UserProfile) {
  if (config.AI_PROVIDER === "mock") return mockFreeReport(profile);
  if (config.AI_PROVIDER === "gemini") {
    const messages = buildFreeReportMessages(profile);
    const text = await generateWithGemini(
      messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n"),
      { json: true },
    );
    return freeReportSchema.parse(JSON.parse(text));
  }
  if (config.AI_PROVIDER === "openrouter") {
    const text = await generateOpenRouterText(
      buildFreeReportMessages(profile),
      { json: true },
    );
    return normalizeFreeReport(parseJsonObject(text), profile);
  }
  if (!openai) throw new Error("OpenAI client is not configured");
  const response = await openai.responses.parse({
    model: config.OPENAI_MODEL,
    input: buildFreeReportMessages(profile),
    text: { format: zodTextFormat(freeReportSchema, "free_report") },
  });
  if (!response.output_parsed) throw new Error("OpenAI returned no parsed free report");
  return freeReportSchema.parse(response.output_parsed);
}

export async function generateFullReportWithAI(
  profile: UserProfile,
  freeReport: unknown,
) {
  if (config.AI_PROVIDER === "mock") return mockFullReport(profile);
  if (config.AI_PROVIDER === "gemini") {
    const messages = buildFullReportMessages(profile, freeReport);
    const text = await generateWithGemini(
      messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n"),
      { json: true },
    );
    return fullReportSchema.parse(JSON.parse(text));
  }
  if (config.AI_PROVIDER === "openrouter") {
    const text = await generateOpenRouterText(
      buildFullReportMessages(profile, freeReport),
      { json: true },
    );
    return normalizeFullReport(parseJsonObject(text), profile);
  }
  if (!openai) throw new Error("OpenAI client is not configured");
  const response = await openai.responses.parse({
    model: config.OPENAI_MODEL,
    input: buildFullReportMessages(profile, freeReport),
    text: { format: zodTextFormat(fullReportSchema, "full_report") },
  });
  if (!response.output_parsed) throw new Error("OpenAI returned no parsed full report");
  return fullReportSchema.parse(response.output_parsed);
}

export async function generateChatReplyWithAI(input: {
  profile: UserProfile;
  freeReport: unknown;
  fullReport: unknown;
  history: ChatMessageRecord[];
  question: string;
}) {
  if (config.AI_PROVIDER === "mock") {
    return [
      `针对“${input.question}”，建议先比较课程适配、学历门槛和本科就业入口。`,
      "原因：你的报告更强调路径清晰与风险平衡，不能只看专业名称或短期热度。",
      "风险：若缺少学校层次、城市和当年位次数据，目前只能做方向性判断。",
      "下一步：核对目标学校培养方案、近年职位或就业去向，并结合考试院当年招生计划和一分一段表判断。",
    ].join("\n");
  }
  if (config.AI_PROVIDER === "gemini") {
    const messages = buildChatMessages(input);
    return generateWithGemini(
      messages.map((message) => `${message.role.toUpperCase()}:\n${message.content}`).join("\n\n"),
    );
  }
  if (config.AI_PROVIDER === "openrouter") {
    return generateOpenRouterText(buildChatMessages(input));
  }
  if (!openai) throw new Error("OpenAI client is not configured");
  const response = await openai.responses.create({
    model: config.OPENAI_MODEL,
    input: buildChatMessages(input),
  });
  if (!response.output_text) throw new Error("OpenAI returned an empty chat reply");
  return response.output_text;
}
