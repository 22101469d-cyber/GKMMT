import { motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../components/UI";
import { directions } from "../data/options";
import { useProfileStore } from "../store/profile";

export default function Start() {
  const navigate = useNavigate();
  const { profile, setField } = useProfileStore();

  const select = (value: string) => {
    setField("careerDirection", value);
    window.setTimeout(() => navigate("/steps"), 260);
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
      <PageHeader
        eyebrow="Direction / 01"
        title="你更希望孩子未来走哪条路？"
        description="先选择一个大方向。AI 会在后续判断中继续缩小专业范围，不需要现在就做最终决定。"
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {directions.map((item, index) => {
          const Icon = item.icon;
          const active = profile.careerDirection === item.value;
          return (
            <motion.button
              type="button"
              key={item.value}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.055 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => select(item.value)}
              className={`group relative min-h-52 overflow-hidden border p-6 text-left transition-colors ${
                active
                  ? "border-cyan/60 bg-cyan/[0.09] shadow-glow"
                  : "border-white/[0.09] bg-white/[0.025] hover:border-cyan/30 hover:bg-cyan/[0.035]"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="grid h-10 w-10 place-items-center border border-white/10 bg-white/[0.035] text-cyan">
                  <Icon size={20} />
                </span>
                <span className="font-mono text-[10px] tracking-[0.12em] text-slate-600">{item.code}</span>
              </div>
              <div className="mt-10">
                <h2 className="font-display text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">{item.description}</p>
              </div>
              <div className="absolute bottom-5 right-5">
                {active ? (
                  <span className="grid h-7 w-7 place-items-center bg-cyan text-ink">
                    <Check size={15} />
                  </span>
                ) : (
                  <ArrowUpRight
                    size={17}
                    className="text-slate-700 transition group-hover:text-cyan"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-slate-600">选择后将自动进入下一步，可随时返回修改</p>
    </section>
  );
}
