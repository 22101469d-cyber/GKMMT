import type { UserProfile } from "../types/index.js";

export function fullReportPrompt(profile: UserProfile, freeReport: unknown) {
  return `
请根据用户画像和免费报告生成完整专业风险评估报告。

用户画像：
${JSON.stringify(profile, null, 2)}

免费报告：
${JSON.stringify(freeReport, null, 2)}

要求：
- recommendedMajors 至少 6 个。
- cautiousMajors 至少 4 个。
- rankStrategy 必须包含 chong、wen、bao。
- disclaimer 必须包含“不构成录取承诺”。
- 如果 rank 为空，在 rankStrategy.summary 中明确写“由于缺少准确位次，本部分仅提供方向性建议”。

只输出一个 JSON 对象，严格包含这些顶层字段：
profileType、matchScore、summary、coreConflict、recommendedMajors、cautiousMajors、
rankStrategy、pathAnalysis、familyAdvice、parentSummary、disclaimer。
recommendedMajors 每项必须包含 name、fit、reason、risk。
cautiousMajors 每项必须包含 name、riskLevel、reason、whenToConsider。
rankStrategy 必须包含 summary、chong、wen、bao。
pathAnalysis 必须包含 postgraduate、civilService、employment。
不要输出 Markdown 或代码块。
`.trim();
}
