const replacements: Array<[RegExp, string]> = [
  [/100\s*%\s*不滑档/gi, "降低滑档风险"],
  [/保证录取/g, "提供方向性录取风险参考"],
  [/内部数据/g, "公开可核验数据"],
  [/官方合作/g, "公开信息整理"],
  [/一定能上/g, "存在一定录取可能性"],
  [/必然就业/g, "就业路径相对清晰"],
  [/复刻专家/g, "参考公开方法论"],
  [/张雪峰\s*AI/gi, "高考志愿 AI 顾问"],
];

function sanitizeString(value: string) {
  return replacements.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    value,
  );
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") return sanitizeString(value);
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, sanitizeValue(child)]),
    );
  }
  return value;
}

export function sanitizeCompliance<T>(value: T): T {
  return sanitizeValue(value) as T;
}

export function findComplianceTerms(value: unknown): string[] {
  const serialized = JSON.stringify(value);
  return replacements
    .filter(([pattern]) => {
      pattern.lastIndex = 0;
      return pattern.test(serialized);
    })
    .map(([pattern]) => pattern.source);
}
