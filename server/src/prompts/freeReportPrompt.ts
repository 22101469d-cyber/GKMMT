import type { UserProfile } from "../types/index.js";

export function freeReportPrompt(profile: UserProfile) {
  return `
请根据以下用户画像生成免费初步分析：
${JSON.stringify(profile, null, 2)}

只输出一个 JSON 对象，严格使用以下结构，不要增加外层字段：
{
  "profileType": "字符串",
  "matchScore": 0到100的整数,
  "summary": "字符串",
  "risks": ["字符串", "字符串", "字符串"],
  "recommendedFields": ["字符串", "字符串", "字符串"],
  "parentSummary": "字符串",
  "disclaimer": "必须包含不构成录取承诺"
}

只做方向性分析，不进行具体院校录取预测。
`.trim();
}
