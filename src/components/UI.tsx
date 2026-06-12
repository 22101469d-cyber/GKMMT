import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export function CTAButton({
  to,
  children,
  secondary = false,
  className = "",
}: {
  to: string;
  children: React.ReactNode;
  secondary?: boolean;
  className?: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={className}>
      <Link
        to={to}
        className={`group flex h-[52px] items-center justify-center gap-3 px-6 text-sm font-semibold transition ${
          secondary
            ? "border border-white/12 bg-white/[0.035] text-white hover:border-cyan/35 hover:bg-cyan/[0.06]"
            : "border border-acid bg-acid text-ink shadow-acid hover:bg-[#dbff96]"
        }`}
      >
        {children}
        <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
      </Link>
    </motion.div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <span className="eyebrow">{eyebrow}</span>
      <h1 className="text-balance mt-6 font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-5xl">
        {title}
      </h1>
      <p className="text-balance mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
        {description}
      </p>
    </header>
  );
}

export function BackButton({ to, label = "返回" }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
    >
      <ChevronLeft size={17} />
      {label}
    </Link>
  );
}

export function ProgressPath({
  items,
  active,
}: {
  items: string[];
  active?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <motion.div
          key={`${item}-${index}`}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.06 }}
          className="flex items-center gap-2"
        >
          <span
            className={`border px-2.5 py-1 text-xs ${
              index === active
                ? "border-cyan/40 bg-cyan/10 text-cyan"
                : "border-white/[0.08] bg-white/[0.025] text-slate-400"
            }`}
          >
            {item}
          </span>
          {index < items.length - 1 && <span className="text-slate-700">/</span>}
        </motion.div>
      ))}
    </div>
  );
}

export function RiskBadge({
  level,
}: {
  level: "高风险" | "需评估" | "低风险";
}) {
  const style =
    level === "高风险"
      ? "border-red-400/25 bg-red-400/10 text-red-300"
      : level === "需评估"
        ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
        : "border-cyan/25 bg-cyan/10 text-cyan";
  return <span className={`border px-2 py-1 text-[11px] ${style}`}>{level}</span>;
}

export function DisclaimerBlock() {
  return (
    <div className="flex gap-4 border border-white/[0.08] bg-white/[0.025] p-5 text-xs leading-6 text-slate-400">
      <ShieldCheck className="mt-0.5 shrink-0 text-cyan" size={19} />
      <p>
        本报告由 AI 根据用户填写信息和公开信息生成，仅供方向性参考，不构成录取保证。
        最终志愿填报应以各省考试院、院校招生章程和当年招生计划为准。
      </p>
    </div>
  );
}

export function LockedRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.07] py-3 text-sm text-slate-300 last:border-0">
      <span className="flex items-center gap-2">
        <Check size={15} className="text-acid" />
        {children}
      </span>
      <LockKeyhole size={14} className="text-slate-600" />
    </div>
  );
}
