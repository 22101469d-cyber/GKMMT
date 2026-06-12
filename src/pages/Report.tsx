import {
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Download,
  GraduationCap,
  Landmark,
  MessageSquareText,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { DisclaimerBlock, RiskBadge } from "../components/UI";
import {
  createChatSession,
  getChatSessionsByReport,
  getReport,
} from "../lib/ai";
import { useProfileStore } from "../store/profile";

export default function Report() {
  const navigate = useNavigate();
  const {
    profile,
    reportId,
    fullReport,
    chatSessionId,
    setFreeReport,
    setFullReport,
    setChatSessionId,
  } = useProfileStore();
  const [loading, setLoading] = useState(!fullReport);
  const [loadError, setLoadError] = useState("");
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (fullReport || !reportId) return;
    setLoading(true);
    getReport(reportId)
      .then((response) => {
        if (response.freeReport) setFreeReport(response.freeReport);
        if (!response.fullReport) throw new Error("完整报告尚未生成，请返回支付页重试");
        setFullReport(response.fullReport);
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : "报告读取失败"))
      .finally(() => setLoading(false));
  }, [fullReport, reportId, setFreeReport, setFullReport]);

  if (!reportId || !profile.careerDirection) return <Navigate to="/score" replace />;
  if (loading) return <div className="grid min-h-[calc(100vh-4rem)] place-items-center text-sm text-slate-500">正在从数据库读取完整报告…</div>;
  if (loadError || !fullReport) return (
    <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-5">
      <div className="panel max-w-md p-7 text-center">
        <div className="text-sm text-red-200">{loadError || "报告不存在"}</div>
        <button type="button" onClick={() => navigate("/pay")} className="mt-5 h-11 bg-acid px-5 text-sm font-semibold text-ink">
          返回支付页重试
        </button>
      </div>
    </div>
  );

  const openChat = async () => {
    if (openingChat) return;
    setOpeningChat(true);
    setLoadError("");
    try {
      if (chatSessionId) {
        navigate(`/chat/${chatSessionId}`);
        return;
      }
      const existing = await getChatSessionsByReport(reportId);
      const existingSession = existing.sessions[0];
      if (existingSession) {
        setChatSessionId(existingSession.id);
        navigate(`/chat/${existingSession.id}`);
        return;
      }
      const created = await createChatSession(reportId);
      setChatSessionId(created.chatSessionId);
      navigate(`/chat/${created.chatSessionId}`);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "追问会话创建失败");
      setOpeningChat(false);
    }
  };

  const paths = [
    {
      icon: GraduationCap,
      title: "考研路径",
      level: "可作为能力放大器",
      text: fullReport.pathAnalysis.postgraduate,
    },
    {
      icon: Landmark,
      title: "考公路径",
      level: "保留岗位覆盖面",
      text: fullReport.pathAnalysis.civilService,
    },
    {
      icon: BriefcaseBusiness,
      title: "本科就业路径",
      level: "强调技能与实习",
      text: fullReport.pathAnalysis.employment,
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <header className="relative overflow-hidden border border-white/[0.09] bg-[#0d131d] p-6 sm:p-9">
        <div className="absolute right-0 top-0 h-60 w-60 bg-cyan/[0.07] blur-[80px]" />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-5 flex items-center gap-3 text-[10px] tracking-[0.14em] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-acid" />
              AI DECISION REPORT / MVP
            </div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">高考专业风险评估报告</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400">
              依据当前填写信息生成的方向性分析，用于缩小研究范围和识别关键风险。
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex h-11 items-center justify-center gap-2 border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:border-cyan/30 hover:text-white"
          >
            <Download size={16} /> 导出 / 打印
          </button>
        </div>
      </header>

      <div className="mt-4 grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="panel h-fit p-6 lg:sticky lg:top-20">
          <div className="mb-6 text-[10px] tracking-[0.13em] text-slate-600">USER SIGNALS</div>
          <dl className="space-y-5">
            {[
              ["未来方向", profile.careerDirection],
              ["核心偏好", profile.priority],
              ["学习投入", profile.longTermStudy],
              ["城市偏好", profile.cityPreference],
              ["风险策略", profile.riskPreference],
              ["高考信息", `${profile.province} / ${profile.subjectType}`],
              ["预估区间", `${profile.score} 分${profile.rank ? ` / ${profile.rank} 位` : ""}`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10px] text-slate-600">{label}</dt>
                <dd className="mt-1.5 text-sm text-slate-300">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <div className="space-y-4">
          <section className="panel p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-[12rem_1fr]">
              <div>
                <span className="text-[10px] tracking-[0.12em] text-cyan">01 / CORE ISSUE</span>
                <h2 className="mt-3 font-display text-xl font-semibold">当前选择的核心矛盾</h2>
              </div>
              <p className="border-l border-cyan/20 pl-5 text-sm leading-8 text-slate-300">{fullReport.coreConflict}</p>
            </div>
          </section>

          <section className="panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/[0.08] p-6 sm:p-8">
              <div>
                <span className="text-[10px] tracking-[0.12em] text-cyan">02 / RECOMMENDED POOL</span>
                <h2 className="mt-3 font-display text-xl font-semibold">优先考虑的专业方向</h2>
              </div>
              <BookOpenCheck className="text-cyan" size={22} />
            </div>
            <div className="hidden grid-cols-[1.1fr_.5fr_1.5fr_1.5fr] border-b border-white/[0.07] px-8 py-3 text-[10px] text-slate-600 md:grid">
              <span>专业方向</span><span>推荐度</span><span>适合原因</span><span>风险提醒</span>
            </div>
            {fullReport.recommendedMajors.map((major) => (
              <div key={major.name} className="grid gap-4 border-b border-white/[0.07] p-6 last:border-0 md:grid-cols-[1.1fr_.5fr_1.5fr_1.5fr] md:px-8">
                <strong className="text-sm font-medium text-white">{major.name}</strong>
                <span className="text-sm text-acid">{major.fit}</span>
                <p className="text-xs leading-6 text-slate-400">{major.reason}</p>
                <p className="text-xs leading-6 text-slate-500">{major.risk}</p>
              </div>
            ))}
          </section>

          <section className="panel p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="text-[10px] tracking-[0.12em] text-amber-300">03 / CAUTION POOL</span>
                <h2 className="mt-3 font-display text-xl font-semibold">需要谨慎选择的方向</h2>
              </div>
              <TriangleAlert className="text-amber-300" size={22} />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {fullReport.cautiousMajors.map((major) => (
                <article key={major.name} className="border border-white/[0.08] bg-white/[0.02] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium">{major.name}</h3>
                    <RiskBadge level={major.riskLevel === "高风险" ? "高风险" : major.riskLevel === "低风险" ? "低风险" : "需评估"} />
                  </div>
                  <p className="mt-5 text-xs leading-6 text-slate-400">{major.reason}</p>
                  <div className="mt-5 border-t border-white/[0.07] pt-4 text-[11px] leading-5 text-slate-600">
                    可考虑条件：{major.whenToConsider}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <span className="text-[10px] tracking-[0.12em] text-cyan">04 / POSITION STRATEGY</span>
            <h2 className="mt-3 font-display text-xl font-semibold">位次策略与冲稳保逻辑</h2>
            <p className="mt-5 border-l border-acid/40 pl-5 text-sm leading-7 text-slate-400">{fullReport.rankStrategy.summary}</p>
            <div className="mt-7 grid border-l border-t border-white/[0.08] md:grid-cols-3">
              {[
                ["冲", "争取学校层次或城市资源", fullReport.rankStrategy.chong],
                ["稳", "建立方案的主体部分", fullReport.rankStrategy.wen],
                ["保", "守住可接受的底线", fullReport.rankStrategy.bao],
              ].map(([label, title, text]) => (
                <div key={label} className="border-b border-r border-white/[0.08] p-5">
                  <span className="font-display text-2xl font-semibold text-cyan">{label}</span>
                  <h3 className="mt-5 text-sm font-medium">{title}</h3>
                  <p className="mt-3 text-xs leading-6 text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel p-6 sm:p-8">
            <span className="text-[10px] tracking-[0.12em] text-cyan">05 / FUTURE ROUTES</span>
            <h2 className="mt-3 font-display text-xl font-semibold">考研 / 考公 / 就业路径</h2>
            <div className="mt-7 grid gap-3 md:grid-cols-3">
              {paths.map(({ icon: Icon, title, level, text }) => (
                <article key={title} className="border border-white/[0.08] p-5">
                  <Icon size={20} className="text-cyan" />
                  <h3 className="mt-6 font-display font-semibold">{title}</h3>
                  <div className="mt-2 text-[11px] text-acid">{level}</div>
                  <p className="mt-4 text-xs leading-6 text-slate-500">{text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <article className="border border-cyan/15 bg-cyan/[0.035] p-6">
              <Building2 size={21} className="text-cyan" />
              <h2 className="mt-5 font-display text-lg font-semibold">普通家庭决策建议</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {fullReport.familyAdvice}
              </p>
            </article>
            <article className="border border-acid/15 bg-acid/[0.035] p-6">
              <CheckCircle2 size={21} className="text-acid" />
              <h2 className="mt-5 font-display text-lg font-semibold">给家长的一段话</h2>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {fullReport.parentSummary}
              </p>
            </article>
          </section>
          <section className="relative overflow-hidden border border-cyan/20 bg-cyan/[0.04] p-6 sm:p-8">
            <div className="absolute right-0 top-0 h-40 w-40 bg-cyan/[0.07] blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3 text-cyan">
                  <MessageSquareText size={20} />
                  <span className="text-[10px] tracking-[0.13em]">AI FOLLOW-UP / 20 QUESTIONS</span>
                </div>
                <h2 className="mt-4 font-display text-xl font-semibold">针对这份报告继续追问</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                  可以继续比较具体专业、城市、升学路径和家庭决策。AI 会带着当前画像和完整报告回答。
                </p>
              </div>
              <button
                type="button"
                onClick={openChat}
                disabled={openingChat}
                className="h-12 shrink-0 bg-acid px-6 text-sm font-semibold text-ink disabled:cursor-wait disabled:opacity-60"
              >
                {openingChat ? "正在进入追问…" : "进入 AI 追问"}
              </button>
            </div>
            {loadError && <p className="relative mt-4 text-xs text-red-200">{loadError}</p>}
          </section>
          <DisclaimerBlock />
        </div>
      </div>
    </section>
  );
}
