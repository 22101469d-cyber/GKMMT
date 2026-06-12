import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUp,
  BrainCircuit,
  ChevronLeft,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  ApiError,
  getChatMessages,
  sendChatMessage,
} from "../lib/ai";
import { useProfileStore } from "../store/profile";
import type { ChatMessage } from "../types";

const prompts = [
  "这份报告里最值得优先验证的专业是什么？",
  "如果不考研，哪些方向需要重新排序？",
  "怎样判断一个专业是否适合普通家庭？",
];

export default function Chat() {
  const { chatSessionId = "" } = useParams();
  const { reportId, setChatSessionId } = useProfileStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [remaining, setRemaining] = useState(20);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    if (!chatSessionId) return;
    setLoading(true);
    setError("");
    try {
      const response = await getChatMessages(chatSessionId);
      setMessages(response.messages.filter((message) => message.role !== "system"));
      const used = response.messages.filter((message) => message.role === "user").length;
      setRemaining(Math.max(0, 20 - used));
      setChatSessionId(chatSessionId);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "对话读取失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMessages();
  }, [chatSessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  if (!reportId || !chatSessionId) return <Navigate to="/report" replace />;

  const submit = async (event?: FormEvent, prompt?: string) => {
    event?.preventDefault();
    const content = (prompt ?? question).trim();
    if (!content || sending || remaining <= 0) return;

    const optimistic: ChatMessage = {
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    setQuestion("");
    setSending(true);
    setError("");
    try {
      const response = await sendChatMessage(chatSessionId, content);
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
      setRemaining(response.remainingMessages);
    } catch (requestError) {
      setMessages((current) => current.slice(0, -1));
      const message =
        requestError instanceof ApiError && requestError.code === "CHAT_LIMIT_EXCEEDED"
          ? "20 次追问额度已使用完毕"
          : requestError instanceof Error
            ? requestError.message
            : "发送失败，请重试";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col px-5 py-8 lg:px-8">
      <header className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link to="/report" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
            <ChevronLeft size={15} /> 返回完整报告
          </Link>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center border border-cyan/25 bg-cyan/[0.06] text-cyan">
              <BrainCircuit size={20} />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold">AI 志愿追问</h1>
              <p className="mt-1 text-xs text-slate-500">回答会自动结合你的画像与完整报告</p>
            </div>
          </div>
        </div>
        <div className="border border-white/[0.09] bg-white/[0.025] px-4 py-3 text-right">
          <div className="text-[10px] tracking-[0.12em] text-slate-600">REMAINING</div>
          <div className="mt-1 font-mono text-lg text-acid">{remaining} / 20</div>
        </div>
      </header>

      <div className="flex-1 py-8">
        {loading ? (
          <div className="grid min-h-[20rem] place-items-center text-sm text-slate-500">正在读取历史追问…</div>
        ) : messages.length === 0 ? (
          <div className="mx-auto max-w-2xl py-14 text-center">
            <Sparkles size={28} className="mx-auto text-cyan" />
            <h2 className="mt-5 font-display text-2xl font-semibold">从报告中继续往下问。</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              越具体的问题，越容易得到可执行的判断。你可以从下面任意一个问题开始。
            </p>
            <div className="mt-8 grid gap-3">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submit(undefined, prompt)}
                  className="border border-white/[0.09] bg-white/[0.025] p-4 text-left text-sm text-slate-300 transition hover:border-cyan/30 hover:bg-cyan/[0.04]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message, index) => (
              <motion.div
                key={`${message.createdAt}-${index}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={message.role === "user" ? "ml-auto max-w-[85%]" : "mr-auto max-w-[92%]"}
              >
                <div className="mb-2 text-[10px] tracking-[0.1em] text-slate-600">
                  {message.role === "user" ? "你的问题" : "AI 志愿顾问"}
                </div>
                <div className={message.role === "user"
                  ? "border border-acid/20 bg-acid/[0.07] p-4 text-sm leading-7 text-slate-200"
                  : "panel whitespace-pre-wrap p-5 text-sm leading-7 text-slate-300"}
                >
                  {message.content}
                </div>
              </motion.div>
            ))}
            {sending && (
              <div className="mr-auto max-w-[92%]">
                <div className="mb-2 text-[10px] tracking-[0.1em] text-slate-600">AI 志愿顾问</div>
                <div className="panel flex items-center gap-3 p-5 text-sm text-slate-500">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  >
                    <BrainCircuit size={17} className="text-cyan" />
                  </motion.span>
                  正在结合完整报告思考，通常约 35 秒，繁忙时可能更久…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="sticky bottom-0 border-t border-white/[0.08] bg-ink/90 py-4 backdrop-blur-xl">
        {error && (
          <div className="mx-auto mb-3 flex max-w-3xl items-center gap-3 border border-red-400/20 bg-red-400/[0.05] p-3 text-xs text-red-200">
            <AlertCircle size={15} />
            <span className="flex-1">{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="关闭错误提示">
              <RotateCcw size={14} />
            </button>
          </div>
        )}
        <form onSubmit={(event) => void submit(event)} className="mx-auto flex max-w-3xl gap-2">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            disabled={sending || remaining <= 0}
            rows={2}
            maxLength={3000}
            placeholder={remaining > 0 ? "输入你想继续追问的问题…" : "追问额度已用完"}
            className="min-h-[56px] flex-1 resize-none border border-white/[0.1] bg-[#0b1018] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-700 focus:border-cyan/40 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!question.trim() || sending || remaining <= 0}
            className="grid h-14 w-14 shrink-0 place-items-center bg-acid text-ink disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="发送问题"
          >
            <ArrowUp size={20} />
          </button>
        </form>
      </div>
    </section>
  );
}
