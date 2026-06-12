import {
  Activity,
  BadgeDollarSign,
  Building2,
  Cpu,
  HelpCircle,
  Landmark,
} from "lucide-react";

export const directions = [
  {
    value: "稳定体制内",
    title: "稳定体制内",
    description: "考公、事业编、国企央企、教师编制",
    icon: Landmark,
    code: "PATH 01",
  },
  {
    value: "高薪就业",
    title: "高薪就业",
    description: "互联网、金融、咨询与高成长行业",
    icon: BadgeDollarSign,
    code: "PATH 02",
  },
  {
    value: "技术路线",
    title: "技术路线",
    description: "计算机、电气、自动化、电子信息",
    icon: Cpu,
    code: "PATH 03",
  },
  {
    value: "医疗健康",
    title: "医疗健康",
    description: "医学、药学、护理、康复与健康产业",
    icon: Activity,
    code: "PATH 04",
  },
  {
    value: "商科管理",
    title: "商科管理",
    description: "财会、金融、管理、市场与供应链",
    icon: Building2,
    code: "PATH 05",
  },
  {
    value: "还不确定",
    title: "还不确定",
    description: "让 AI 先判断更匹配的方向范围",
    icon: HelpCircle,
    code: "PATH 06",
  },
];

export const questions = [
  {
    key: "priority" as const,
    eyebrow: "价值排序",
    title: "报志愿时，你最看重什么？",
    hint: "没有标准答案。这个选择决定系统优先保留什么。",
    options: ["稳定就业", "收入上限", "学校名气", "城市资源", "专业兴趣", "不浪费分数"],
  },
  {
    key: "longTermStudy" as const,
    eyebrow: "投入周期",
    title: "你能接受考研、考证或长期学习吗？",
    hint: "不同专业的有效出口，对学历和资格证要求差异很大。",
    options: ["可以接受", "不太想考研", "只想本科就业", "看专业再决定"],
  },
  {
    key: "cityPreference" as const,
    eyebrow: "城市约束",
    title: "你对城市有什么要求？",
    hint: "城市不仅影响四年体验，也会改变实习与第一份工作的机会。",
    options: ["优先一线城市", "省会城市也可以", "希望留在本省", "可以接受出省", "城市无所谓，专业更重要"],
  },
  {
    key: "riskPreference" as const,
    eyebrow: "风险策略",
    title: "家庭更希望选择哪种风险策略？",
    hint: "系统会据此调整学校层次、专业接受度和录取风险的权重。",
    options: ["稳妥优先", "可以适度冲刺", "尽量不浪费分数", "优先保证专业可接受", "还不确定"],
  },
];
