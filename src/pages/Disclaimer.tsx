import { DatabaseZap, FileWarning, Scale, ShieldAlert } from "lucide-react";
import { Footer } from "../components/Layout";
import { PageHeader } from "../components/UI";

const items = [
  {
    icon: ShieldAlert,
    title: "AI 辅助分析",
    text: "本服务根据用户填写内容和可获得的公开信息生成方向性建议，不替代考生与监护人的独立判断。",
  },
  {
    icon: Scale,
    title: "不构成录取承诺",
    text: "分析结果不预测或承诺具体录取结果，也不代表任何考试院、院校或招生机构的意见。",
  },
  {
    icon: FileWarning,
    title: "以官方信息为准",
    text: "招生政策、专业计划、选科要求和院校章程可能变化，最终应核对当年官方发布的信息。",
  },
  {
    icon: DatabaseZap,
    title: "数据存在时效边界",
    text: "公开数据可能存在滞后、缺失或统计口径差异。涉及分数、位次与计划时，应在填报前再次验证。",
  },
];

export default function Disclaimer() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
        <PageHeader
          eyebrow="Trust & boundaries"
          title="把 AI 放在正确的位置上。"
          description="它适合帮助家庭整理信息、发现矛盾和建立验证清单，但不能代替官方政策、专业顾问或最终决策。"
        />
        <div className="mx-auto mt-12 grid max-w-4xl gap-3 sm:grid-cols-2">
          {items.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="panel min-h-56 p-6">
              <div className="flex items-start justify-between">
                <Icon size={21} className="text-cyan" />
                <span className="font-mono text-[10px] text-slate-700">0{index + 1}</span>
              </div>
              <h2 className="mt-9 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-4 text-sm leading-7 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
        <div className="mx-auto mt-8 max-w-4xl border border-red-300/10 bg-red-300/[0.025] p-6">
          <h2 className="text-sm font-medium text-red-200">明确禁止的宣传与表述</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            本产品不使用“保录取”“内部数据”“官方合作”“一定能上”“必然就业”等误导性表述，
            也不会以任何专家本人或官方机构名义提供服务。
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
