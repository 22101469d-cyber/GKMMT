import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, BrainCircuit, Info, MapPin, RefreshCw, Target } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton, PageHeader } from "../components/UI";
import { generateFreeReport, saveProfile, validateReportCompliance } from "../lib/ai";
import { useProfileStore } from "../store/profile";

const provinces = [
  "北京", "上海", "天津", "重庆", "河北", "河南", "山东", "山西", "陕西", "江苏",
  "浙江", "安徽", "江西", "湖北", "湖南", "广东", "广西", "四川", "贵州", "云南",
  "辽宁", "吉林", "黑龙江", "福建", "海南", "甘肃", "青海", "宁夏", "内蒙古", "新疆", "西藏",
];

export default function Score() {
  const navigate = useNavigate();
  const {
    profile,
    setProfile,
    setFreeReport,
    setProfileId,
    setReportId,
    clearAnalysis,
  } = useProfileStore();
  const [form, setForm] = useState({
    province: profile.province,
    subjectType: profile.subjectType,
    score: profile.score,
    rank: profile.rank || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!submitting) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [submitting]);

  const runAnalysis = async () => {
    setSubmitError("");
    setSubmitting(true);
    const nextProfile = { ...profile, ...form };
    setProfile(form);
    clearAnalysis();
    try {
      const saved = await saveProfile(nextProfile);
      setProfileId(saved.profileId);
      const generated = await generateFreeReport(saved.profileId);
      if (!validateReportCompliance(generated.freeReport)) {
        throw new Error("报告合规检查未通过，请重新生成");
      }
      setReportId(generated.reportId);
      setFreeReport(generated.freeReport);
      navigate("/result", { state: { fresh: true } });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "生成失败，请重试");
      setSubmitting(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.province) nextErrors.province = "请选择高考省份";
    if (!form.subjectType) nextErrors.subjectType = "请选择科类或选科";
    if (!form.score) nextErrors.score = "请填写预估分数";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    await runAnalysis();
  };

  const fieldClass =
    "h-[52px] w-full border border-white/[0.1] bg-[#0b1018] px-4 text-sm text-white outline-none transition placeholder:text-slate-700 focus:border-cyan/45 focus:bg-cyan/[0.025]";

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
      <BackButton to="/steps" label="返回偏好判断" />
      <div className="mt-8">
        <PageHeader
          eyebrow="Calibration / 05"
          title="最后一步：结合分数和位次判断策略。"
          description="如果暂时没有准确位次，也可以先填写预估分数。系统会明确标注分析精度，不用为了填满信息而猜测。"
        />
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-[1fr_1.75fr]">
        <aside className="panel p-6">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center border border-cyan/20 bg-cyan/[0.06] text-cyan">
              <Target size={18} />
            </span>
            <div>
              <div className="text-sm font-medium">当前分析路径</div>
              <div className="mt-1 text-[10px] tracking-[0.12em] text-slate-600">PROFILE SIGNALS</div>
            </div>
          </div>
          <dl className="space-y-5">
            {[
              ["未来方向", profile.careerDirection],
              ["核心偏好", profile.priority],
              ["学习投入", profile.longTermStudy],
              ["城市约束", profile.cityPreference],
              ["风险策略", profile.riskPreference],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-white/[0.07] pb-4 last:border-0">
                <dt className="text-[11px] text-slate-600">{label}</dt>
                <dd className="mt-1.5 text-sm text-slate-300">{value || "待补充"}</dd>
              </div>
            ))}
          </dl>
        </aside>

        <form onSubmit={submit} className="panel p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2.5 flex items-center gap-2 text-xs text-slate-400">
                <MapPin size={14} /> 高考省份
              </span>
              <select
                className={fieldClass}
                value={form.province}
                onChange={(event) => setForm({ ...form, province: event.target.value })}
              >
                <option value="">请选择省份</option>
                {provinces.map((province) => <option key={province}>{province}</option>)}
              </select>
              {errors.province && <span className="mt-2 block text-xs text-red-300">{errors.province}</span>}
            </label>
            <label className="block">
              <span className="mb-2.5 block text-xs text-slate-400">选科 / 文理</span>
              <select
                className={fieldClass}
                value={form.subjectType}
                onChange={(event) => setForm({ ...form, subjectType: event.target.value })}
              >
                <option value="">请选择科类</option>
                <option>物理类</option>
                <option>历史类</option>
                <option>理科</option>
                <option>文科</option>
                <option>综合改革</option>
              </select>
              {errors.subjectType && <span className="mt-2 block text-xs text-red-300">{errors.subjectType}</span>}
            </label>
            <label className="block">
              <span className="mb-2.5 block text-xs text-slate-400">预估分数</span>
              <input
                type="number"
                min="0"
                max="750"
                inputMode="numeric"
                className={fieldClass}
                placeholder="例如：586"
                value={form.score}
                onChange={(event) => setForm({ ...form, score: event.target.value })}
              />
              {errors.score && <span className="mt-2 block text-xs text-red-300">{errors.score}</span>}
            </label>
            <label className="block">
              <span className="mb-2.5 flex items-center gap-2 text-xs text-slate-400">
                预估位次 <span className="text-slate-700">选填</span>
              </span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                className={fieldClass}
                placeholder="例如：32500"
                value={form.rank}
                onChange={(event) => setForm({ ...form, rank: event.target.value })}
              />
            </label>
          </div>
          <div className="mt-7 flex gap-3 border border-cyan/10 bg-cyan/[0.03] p-4 text-xs leading-6 text-slate-500">
            <Info size={17} className="mt-0.5 shrink-0 text-cyan/70" />
            位次比单纯分数更适合做志愿策略判断。暂时没有也没关系，报告会降低相应结论的确定度。
          </div>
          {submitting && (
            <div className="mt-5 border border-cyan/20 bg-cyan/[0.04] p-5">
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="grid h-9 w-9 place-items-center border border-cyan/25 text-cyan"
                >
                  <BrainCircuit size={18} />
                </motion.span>
                <div>
                  <div className="text-sm font-medium">
                    {elapsed < 8
                      ? "正在读取你的决策信号"
                      : elapsed < 22
                        ? "正在调用 AI 评估专业风险"
                        : "正在整理报告并执行合规检查"}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    免费模型通常需要约 35 秒，繁忙时可能更久 · 已分析 {elapsed} 秒
                  </div>
                </div>
              </div>
              <div className="mt-4 h-1 overflow-hidden bg-white/[0.06]">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan to-acid"
                  animate={{ width: `${Math.min(94, 8 + elapsed * 2.35)}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
            </div>
          )}
          {submitError && (
            <div className="mt-5 flex items-start gap-3 border border-red-400/20 bg-red-400/[0.05] p-4 text-xs text-red-200">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <div className="flex-1">
                <div>{submitError}</div>
                <button
                  type="button"
                  onClick={runAnalysis}
                  className="mt-3 inline-flex items-center gap-2 text-white"
                >
                  <RefreshCw size={13} /> 重新生成
                </button>
              </div>
            </div>
          )}
          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.99 }}
            className="mt-7 flex h-14 w-full items-center justify-center gap-3 bg-acid font-semibold text-ink shadow-acid transition hover:bg-[#dcff9d] disabled:cursor-wait disabled:opacity-70"
          >
            {submitting ? `AI 正在分析 · ${elapsed}s` : "生成我的初步分析"}
            {!submitting && <ArrowRight size={18} />}
          </motion.button>
        </form>
      </div>
    </section>
  );
}
