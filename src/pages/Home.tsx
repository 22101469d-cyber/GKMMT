import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowDown,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleDot,
  GraduationCap,
  MapPinned,
  Network,
  Radar,
  Route,
  School,
  ScrollText,
  Sparkles,
  Waypoints,
} from "lucide-react";
import { Footer } from "../components/Layout";
import { CTAButton } from "../components/UI";

const signals = [
  { label: "专业适配", value: 86, color: "bg-cyan" },
  { label: "职业出口", value: 78, color: "bg-acid" },
  { label: "城市资源", value: 64, color: "bg-violet" },
];

const process = [
  { number: "01", title: "选择未来方向", text: "先定义希望抵达的职业生活，而不是先猜专业。" },
  { number: "02", title: "逐步判断偏好", text: "把兴趣、投入周期、城市与风险偏好纳入判断。" },
  { number: "03", title: "输入分数位次", text: "让方向选择回到真实的分数和机会约束里。" },
  { number: "04", title: "生成风险报告", text: "得到推荐池、谨慎池与下一步验证清单。" },
];

const features = [
  ["方向匹配度", "识别更接近哪类发展路径", Radar],
  ["专业推荐池", "保留值得继续研究的专业组", GraduationCap],
  ["专业谨慎池", "提前暴露学历与就业风险", CircleDot],
  ["位次策略", "理解分数在本省的相对位置", BarChart3],
  ["冲稳保逻辑", "平衡学校、专业与城市资源", Route],
  ["家长版总结", "把复杂判断翻译成清晰结论", BriefcaseBusiness],
];

const differentiators = [
  {
    number: "01",
    icon: Waypoints,
    label: "REAL-TIME DATA",
    highlight: "实时更新报考数据",
    suffix: "真实历史数据回测更可靠。",
    text: "持续同步各省招生计划、历年位次与专业变化，用历史录取结果回测推荐策略。每条关键判断都能追溯数据年份与来源。",
    status: "实时数据 × 历史回测",
    accent: "cyan",
  },
  {
    number: "02",
    icon: ScrollText,
    label: "EXPERT DISTILLATION",
    highlight: "蒸馏张雪峰老师公益模型",
    suffix: "一针见血指出痛点与趋势。",
    text: "吸收其公开公益内容与开源 Skill 中的教育规划方法，重点拆解学历成本、岗位出口、家庭资源和行业趋势，不说正确但没用的套话。",
    status: "公益内容方法论蒸馏",
    accent: "acid",
  },
  {
    number: "03",
    icon: Network,
    label: "FRONTIER AI ENGINE",
    highlight: "调用 ChatGPT Pro 满血级模型",
    suffix: "释放尖端 AI 处理能力。",
    text: "生产环境通过 OpenAI API 接入顶级推理模型，完成长上下文分析、多变量权衡、结构化报告、证据引用与合规校验。",
    status: "OpenAI 顶级模型能力",
    accent: "violet",
  },
];

function ScrollSignalField() {
  const { scrollYProgress } = useScroll();
  const slowY = useTransform(scrollYProgress, [0, 1], [0, 420]);
  const reverseY = useTransform(scrollYProgress, [0, 1], [80, -300]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 42]);
  const lineX = useTransform(scrollYProgress, [0, 1], ["-20%", "120%"]);
  const progressScale = useSpring(scrollYProgress, { stiffness: 110, damping: 24, mass: 0.3 });

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      <motion.div
        className="fixed left-0 right-0 top-16 z-40 h-px origin-left bg-gradient-to-r from-cyan via-acid to-violet"
        style={{ scaleX: progressScale }}
      />
      <motion.div
        style={{ x: lineX }}
        className="fixed top-[28%] z-0 hidden h-px w-64 bg-gradient-to-r from-transparent via-cyan/25 to-transparent lg:block"
      />
      <motion.div
        style={{ y: slowY }}
        className="absolute -left-28 top-[38rem] h-[34rem] w-[34rem] rounded-full border border-cyan/[0.055]"
      >
        <div className="absolute inset-[18%] rounded-full border border-dashed border-cyan/[0.06]" />
        <div className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan/30 shadow-[0_0_18px_rgba(100,216,255,.5)]" />
      </motion.div>
      <motion.div
        style={{ y: reverseY, rotate }}
        className="absolute -right-32 top-[72rem] h-[28rem] w-[28rem] border border-white/[0.045]"
      >
        <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-cyan/15 via-transparent to-transparent" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </motion.div>
      <motion.div
        style={{ y: reverseY }}
        className="absolute left-[7%] top-[108rem] hidden font-mono text-[9px] tracking-[0.18em] text-slate-800 lg:block"
      >
        34.7466° N / DECISION SIGNAL
      </motion.div>
      {[18, 34, 61, 78].map((left, index) => (
        <motion.span
          key={left}
          className="absolute h-1 w-1 rounded-full bg-cyan/50 shadow-[0_0_12px_rgba(100,216,255,.55)]"
          style={{ left: `${left}%`, top: `${50 + index * 38}rem`, y: index % 2 ? reverseY : slowY }}
          animate={{ opacity: [0.2, 0.9, 0.2], scale: [1, 1.8, 1] }}
          transition={{ duration: 3.5 + index, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function DecisionConsole() {
  const nodes = [
    { label: "学校", icon: School, className: "left-[6%] top-[18%]" },
    { label: "城市", icon: MapPinned, className: "right-[5%] top-[16%]" },
    { label: "考研", icon: GraduationCap, className: "left-[2%] bottom-[18%]" },
    { label: "就业", icon: BriefcaseBusiness, className: "right-[2%] bottom-[16%]" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.8 }}
      className="relative mx-auto aspect-[1.02] w-full max-w-[560px]"
    >
      <div className="absolute inset-[13%] rounded-full border border-white/[0.07]" />
      <div className="absolute inset-[25%] rounded-full border border-dashed border-cyan/15" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(100,216,255,.12),transparent_61%)]" />
      <div className="absolute inset-[34%] grid place-items-center rounded-full border border-cyan/25 bg-[#0c1420]/90 shadow-[0_0_70px_rgba(100,216,255,.16)]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border border-dashed border-cyan/20"
        />
        <div className="relative text-center">
          <Sparkles className="mx-auto mb-2 text-acid" size={20} />
          <div className="font-display text-sm font-semibold">AI 决策核</div>
          <div className="mt-1 text-[10px] tracking-[0.15em] text-slate-500">SIGNAL ACTIVE</div>
        </div>
      </div>
      {nodes.map(({ label, icon: Icon, className }, index) => (
        <motion.div
          key={label}
          animate={{ y: [0, index % 2 ? 8 : -8, 0] }}
          transition={{ duration: 5 + index, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${className} flex items-center gap-2 border border-white/10 bg-[#0b1019]/85 px-3 py-2 text-xs text-slate-300 backdrop-blur-md`}
        >
          <Icon size={14} className="text-cyan" />
          {label}
        </motion.div>
      ))}
      <div className="panel scanline absolute bottom-[2%] left-[18%] right-[18%] p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[10px] tracking-[0.15em] text-slate-500">路径适配信号</span>
          <span className="flex items-center gap-1 text-[10px] text-acid">
            <span className="h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_8px_#c8ff62]" />
            分析中
          </span>
        </div>
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.label} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
              <span className="text-[11px] text-slate-400">{signal.label}</span>
              <div className="h-1 bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${signal.value}%` }}
                  transition={{ delay: 0.8, duration: 1.1 }}
                  className={`h-full ${signal.color}`}
                />
              </div>
              <span className="text-right font-mono text-[10px] text-slate-500">{signal.value}</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const pointerX = useMotionValue(50);
  const pointerY = useMotionValue(12);
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 24 });
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 24 });
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${smoothX}% ${smoothY}%, rgba(100,216,255,.11), transparent 68%)`;

  return (
    <>
      <motion.div
        className="relative"
        onPointerMove={(event) => {
          pointerX.set((event.clientX / window.innerWidth) * 100);
          pointerY.set(((event.clientY + window.scrollY) / document.documentElement.scrollHeight) * 100);
        }}
      >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{ background: spotlight }}
      />
      <ScrollSignalField />
      <section className="relative z-10 min-h-[calc(100vh-4rem)] overflow-hidden">
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-12">
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 inline-flex items-center gap-3 border border-white/[0.08] bg-white/[0.025] px-3 py-2 text-[11px] tracking-[0.1em] text-slate-400"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-acid shadow-[0_0_10px_#c8ff62]" />
              GAOKAO FUTURE PATH / 2026
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-balance max-w-3xl font-display text-4xl font-semibold leading-[1.16] text-white sm:text-5xl lg:text-[4rem]"
            >
              <span className="sm:hidden">
                别让一次志愿，
                <br />
                决定孩子未来
                <span className="relative ml-2 inline-block text-cyan">
                  十年
                  <span className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-cyan to-transparent" />
                </span>。
              </span>
              <span className="hidden sm:inline">
                别让一个专业名字，
                <br />
                决定孩子未来
                <span className="relative mx-2 inline-block text-cyan">
                  十年的路
                  <span className="absolute -bottom-1 left-0 h-px w-full bg-gradient-to-r from-cyan to-transparent" />
                </span>。
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="mt-7 max-w-xl text-base leading-8 text-slate-400"
            >
              先看职业出口、学历成本和真实位次，再选专业与学校。
              AI 把复杂信息压缩成一份能看懂、能追问、能验证的专业风险报告。
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <CTAButton to="/start">开始 1 分钟分析</CTAButton>
              <CTAButton to="/report" secondary>
                查看报告示例
              </CTAButton>
            </motion.div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              {["无需注册", "免费初步结论", "不做录取承诺"].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-cyan/70" />
                  {item}
                </span>
              ))}
            </div>
          </div>
          <DecisionConsole />
        </div>
        <a
          href="#process"
          aria-label="继续浏览"
          className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-[10px] tracking-[0.14em] text-slate-600 lg:flex"
        >
          EXPLORE
          <ArrowDown size={14} />
        </a>
      </section>

      <section className="relative z-10 border-y border-white/[0.06] bg-[#090d14]/90 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
            <div>
              <span className="eyebrow">Why different</span>
              <h2 className="text-balance mt-6 max-w-lg font-display text-3xl font-semibold leading-tight sm:text-4xl">
                真正的差异，不是更会聊天。
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-400 lg:justify-self-end">
              而是用实时数据校准判断，用专家模型指出痛点，再交给顶级 AI 完成多变量推理。
              从信息输入到报告输出，每一步都有明确职责。
            </p>
          </div>
          <div className="grid border-l border-t border-white/[0.08] lg:grid-cols-3">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              const accentClass =
                item.accent === "acid"
                  ? "text-acid border-acid/20 bg-acid/[0.04]"
                  : item.accent === "violet"
                    ? "text-violet border-violet/20 bg-violet/[0.04]"
                    : "text-cyan border-cyan/20 bg-cyan/[0.04]";
              return (
                <motion.article
                  key={item.highlight}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -6 }}
                  className="group relative min-h-[360px] overflow-hidden border-b border-r border-white/[0.08] bg-[#0b1018]/80 p-7 transition-colors hover:bg-[#0e151f]"
                >
                  <motion.div
                    className="absolute -right-16 -top-16 h-40 w-40 rounded-full border border-white/[0.05]"
                    whileHover={{ scale: 1.15, rotate: 18 }}
                  />
                  <div className="relative flex items-start justify-between">
                    <span className={`grid h-11 w-11 place-items-center border ${accentClass}`}>
                      <Icon size={20} />
                    </span>
                    <span className="font-mono text-[10px] text-slate-700">{item.number}</span>
                  </div>
                  <div className="relative mt-12 text-[10px] tracking-[0.14em] text-slate-600">{item.label}</div>
                  <h3 className="text-balance relative mt-4 font-display text-xl font-semibold leading-8">
                    <span
                      className={`premium-highlight premium-highlight-${item.accent}`}
                    >
                      {item.highlight}
                    </span>
                    <span className="mt-1 block text-white">{item.suffix}</span>
                  </h3>
                  <p className="relative mt-4 text-sm leading-7 text-slate-500">{item.text}</p>
                  <div className="absolute bottom-7 left-7 flex items-center gap-2 text-[10px] text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full ${item.accent === "acid" ? "bg-acid" : item.accent === "violet" ? "bg-violet" : "bg-cyan"}`} />
                    {item.status}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="process" className="relative z-10 border-b border-white/[0.06] bg-[#090d14]/70 py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <span className="eyebrow">Progressive diagnosis</span>
              <h2 className="text-balance mt-6 max-w-md font-display text-3xl font-semibold leading-tight sm:text-4xl">
                不是填一堆问卷，而是一步步缩小选择范围。
              </h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">
                每次只处理一个重要变量，让学生和家长看见选择是如何形成的，而不是被一张结果表推着走。
              </p>
            </div>
            <div className="border-t border-white/[0.08]">
              {process.map((item, index) => (
                <motion.div
                  key={item.number}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.08 }}
                  className="group grid gap-3 border-b border-white/[0.08] py-6 sm:grid-cols-[4rem_12rem_1fr] sm:items-center"
                >
                  <span className="font-mono text-xs text-cyan/60">{item.number}</span>
                  <h3 className="font-display text-base font-semibold group-hover:text-cyan">{item.title}</h3>
                  <p className="text-sm leading-6 text-slate-500">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow">Report structure</span>
              <h2 className="mt-6 font-display text-3xl font-semibold sm:text-4xl">一份报告，回答六个关键问题。</h2>
            </div>
            <p className="max-w-md text-sm leading-7 text-slate-500">
              不堆专业名单。每项建议都同时说明推荐理由、潜在风险与需要进一步核实的信息。
            </p>
          </div>
          <div className="grid border-l border-t border-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
            {features.map(([title, text, Icon], index) => {
              const FeatureIcon = Icon as typeof Building2;
              return (
                <motion.div
                  key={title as string}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group min-h-48 border-b border-r border-white/[0.08] p-7 transition-colors hover:bg-white/[0.025]"
                >
                  <div className="mb-8 flex items-center justify-between">
                    <FeatureIcon size={21} className="text-cyan" />
                    <span className="font-mono text-[10px] text-slate-700">0{index + 1}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold">{title as string}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">{text as string}</p>
                </motion.div>
              );
            })}
          </div>
          <div className="mt-12 flex justify-center">
            <CTAButton to="/start">建立我的决策路径</CTAButton>
          </div>
        </div>
      </section>
      <Footer />
      </motion.div>
    </>
  );
}
