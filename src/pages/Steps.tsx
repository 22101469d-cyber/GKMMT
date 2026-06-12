import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProgressPath } from "../components/UI";
import { questions } from "../data/options";
import { useProfileStore } from "../store/profile";

export default function Steps() {
  const navigate = useNavigate();
  const { profile, setField } = useProfileStore();
  const completedCount = questions.filter((q) => profile[q.key]).length;
  const [index, setIndex] = useState(Math.min(completedCount, questions.length - 1));
  const question = questions[index];

  const path = useMemo(
    () =>
      [
        profile.careerDirection,
        profile.priority,
        profile.longTermStudy,
        profile.cityPreference,
        profile.riskPreference,
      ].filter(Boolean),
    [profile],
  );

  const select = (value: string) => {
    setField(question.key, value);
    window.setTimeout(() => {
      if (index === questions.length - 1) navigate("/score");
      else setIndex((current) => current + 1);
    }, 240);
  };

  return (
    <section className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-5 py-10 lg:px-8">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-5">
        <button
          type="button"
          onClick={() => (index === 0 ? navigate("/start") : setIndex((current) => current - 1))}
          className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ChevronLeft size={17} />
          上一步
        </button>
        <div className="text-xs text-slate-500">
          <span className="text-white">0{index + 2}</span> / 05
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-[10px] tracking-[0.12em] text-slate-600">CURRENT DECISION PATH</div>
        <ProgressPath items={path.length ? path : ["等待选择"]} active={path.length - 1} />
      </div>

      <div className="mx-auto flex min-h-[590px] max-w-4xl items-center py-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={question.key}
            initial={{ opacity: 0, x: 35 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -35 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <span className="eyebrow">{question.eyebrow}</span>
            <h1 className="text-balance mt-6 font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {question.title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-500">{question.hint}</p>

            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const active = profile[question.key] === option;
                return (
                  <motion.button
                    type="button"
                    key={option}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: optionIndex * 0.045 }}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => select(option)}
                    className={`group flex min-h-20 items-center justify-between border px-5 text-left transition ${
                      active
                        ? "border-cyan/50 bg-cyan/[0.08] text-white"
                        : "border-white/[0.09] bg-white/[0.025] text-slate-300 hover:border-cyan/25 hover:bg-white/[0.045]"
                    }`}
                  >
                    <span className="flex items-center gap-4">
                      <span className="font-mono text-[10px] text-slate-600">
                        {String(optionIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="text-sm sm:text-base">{option}</span>
                    </span>
                    <ArrowRight
                      size={16}
                      className={`transition ${active ? "text-cyan" : "text-slate-700 group-hover:text-cyan"}`}
                    />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
