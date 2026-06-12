import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Gauge, ScanSearch } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { DisclaimerBlock, LockedRow } from "../components/UI";
import { useProfileStore } from "../store/profile";

export default function Result() {
  const { profile, freeReport } = useProfileStore();

  if (!profile.careerDirection) return <Navigate to="/start" replace />;
  if (!freeReport) return <Navigate to="/score" replace />;

  return (
    <section className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
      <div className="mb-10 flex flex-col gap-5 border-b border-white/[0.07] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="eyebrow">Free analysis / complete</span>
          <h1 className="mt-5 font-display text-3xl font-semibold sm:text-4xl">你的初步方向已生成。</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_8px_#c8ff62]" />
          已完成合规检查
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-4">
          <article className="panel relative overflow-hidden p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-32 w-32 bg-cyan/[0.06] blur-3xl" />
            <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs text-slate-500">初步画像</span>
                <h2 className="mt-3 font-display text-2xl font-semibold text-cyan">{freeReport.profileType}</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">{freeReport.summary}</p>
              </div>
              <div className="relative grid h-32 w-32 shrink-0 place-items-center">
                <svg className="-rotate-90" width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="53" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7" />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="53"
                    fill="none"
                    stroke="#64d8ff"
                    strokeWidth="7"
                    strokeLinecap="square"
                    strokeDasharray={333}
                    initial={{ strokeDashoffset: 333 }}
                    animate={{ strokeDashoffset: 333 - (333 * freeReport.matchScore) / 100 }}
                    transition={{ duration: 1.1 }}
                  />
                </svg>
                <div className="absolute text-center">
                  <div className="font-mono text-2xl font-semibold">{freeReport.matchScore}</div>
                  <div className="mt-1 text-[9px] tracking-[0.12em] text-slate-600">MATCH</div>
                </div>
              </div>
            </div>
          </article>

          <article className="panel p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <AlertTriangle size={19} className="text-amber-300" />
              <h2 className="font-display text-lg font-semibold">当前最大的 3 个风险</h2>
            </div>
            <div className="space-y-3">
              {freeReport.risks.map((risk, index) => (
                <div key={risk} className="grid grid-cols-[2rem_1fr] border border-white/[0.07] bg-white/[0.02] p-4">
                  <span className="font-mono text-xs text-amber-300/70">0{index + 1}</span>
                  <p className="text-sm leading-6 text-slate-400">{risk}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="panel p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <ScanSearch size={19} className="text-cyan" />
              <h2 className="font-display text-lg font-semibold">优先研究的方向</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {freeReport.recommendedFields.map((field, index) => (
                <div key={field} className="border border-cyan/15 bg-cyan/[0.035] p-4">
                  <div className="mb-6 font-mono text-[10px] text-cyan/50">POOL 0{index + 1}</div>
                  <div className="text-sm font-medium">{field}</div>
                  <div className="mt-2 text-[11px] text-slate-600">建议进入下一轮验证</div>
                </div>
              ))}
            </div>
          </article>
        </div>

        <aside className="space-y-4">
          <div className="panel p-6">
            <div className="mb-5 flex items-center gap-3">
              <Gauge size={19} className="text-acid" />
              <h2 className="font-display font-semibold">家长版结论</h2>
            </div>
            <p className="text-sm leading-7 text-slate-400">
              {freeReport.parentSummary}
            </p>
          </div>

          <div className="border border-acid/25 bg-gradient-to-b from-acid/[0.08] to-white/[0.025] p-6 shadow-acid">
            <span className="text-[10px] tracking-[0.13em] text-acid">FULL REPORT</span>
            <h2 className="mt-4 font-display text-xl font-semibold">解锁完整专业风险评估</h2>
            <div className="mt-5">
              {[
                "8–15 个专业推荐方向",
                "专业谨慎选择清单",
                "结合位次的冲稳保思路",
                "考研 / 考公 / 就业路径",
                "普通家庭决策建议",
              ].map((item) => <LockedRow key={item}>{item}</LockedRow>)}
            </div>
            <Link
              to="/pay"
              className="group mt-6 flex h-[52px] w-full items-center justify-center gap-3 bg-acid font-semibold text-ink transition hover:bg-[#dcff9d]"
            >
              解锁完整报告 ¥19.9
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <p className="mt-3 text-center text-[10px] text-slate-600">开发环境订单，不会产生真实扣款</p>
          </div>
          <DisclaimerBlock />
        </aside>
      </div>
    </section>
  );
}
