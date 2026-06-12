import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

export function GlowBackground() {
  return (
    <>
      <div className="grid-surface" />
      <div className="noise" />
      <motion.div
        className="pointer-events-none fixed -right-32 top-24 -z-[2] h-96 w-96 rounded-full bg-cyan/10 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 24, 0], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const nav = [
    { to: "/report", label: "报告示例" },
    { to: "/disclaimer", label: "使用边界" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-ink/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/" className="group flex items-center gap-3" aria-label="序航 AI 首页">
          <span className="relative grid h-8 w-8 place-items-center border border-cyan/30 bg-cyan/5">
            <span className="h-2.5 w-2.5 rotate-45 border border-cyan bg-cyan/20 transition-transform group-hover:rotate-90" />
          </span>
          <span className="font-display text-[15px] font-semibold tracking-[0.16em]">
            序航 <span className="text-cyan">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm transition-colors ${isActive ? "text-white" : "text-slate-400 hover:text-white"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to="/start"
            className="flex h-9 items-center gap-2 border border-acid/40 bg-acid/10 px-4 text-sm font-medium text-acid transition hover:bg-acid hover:text-ink"
          >
            开始分析 <ArrowUpRight size={15} />
          </Link>
        </nav>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center text-slate-300 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "关闭导航" : "打开导航"}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/[0.06] bg-ink px-5 py-5 md:hidden"
          >
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block border-b border-white/[0.06] py-4 text-sm text-slate-300"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/start"
              onClick={() => setOpen(false)}
              className="mt-5 flex h-12 items-center justify-center bg-acid font-semibold text-ink"
            >
              开始 1 分钟分析
            </Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 text-xs leading-6 text-slate-500 md:flex-row md:items-end md:justify-between lg:px-8">
        <div>
          <div className="mb-2 font-display text-sm font-semibold tracking-[0.14em] text-slate-300">
            序航 AI
          </div>
          <p className="max-w-2xl">
            本服务基于用户填写信息和 AI 模型生成，仅供志愿填报参考，不构成录取承诺。
            最终志愿填报应以各省考试院、院校招生章程和当年招生计划为准。
          </p>
        </div>
        <Link to="/disclaimer" className="whitespace-nowrap text-slate-400 hover:text-white">
          查看完整免责声明
        </Link>
      </div>
    </footer>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-transparent text-white">
      <GlowBackground />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          className="min-h-[calc(100vh-4rem)] pt-16"
        >
          {children}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
