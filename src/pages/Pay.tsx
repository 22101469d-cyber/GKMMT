import { motion } from "framer-motion";
import {
  AlertCircle,
  BrainCircuit,
  Check,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { BackButton } from "../components/UI";
import {
  ApiError,
  createOrder,
  generateFullReport,
  getOrderPaymentStatus,
  initializeOrderPayment,
  markOrderPaid,
  type PaymentInitialization,
  validateReportCompliance,
} from "../lib/ai";
import { useProfileStore } from "../store/profile";

type PaymentMode = PaymentInitialization["paymentMode"];

export default function Pay() {
  const navigate = useNavigate();
  const {
    profileId,
    reportId,
    orderId,
    setOrderId,
    setFullReport,
  } = useProfileStore();
  const [preparing, setPreparing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode | null>(null);
  const [codeUrl, setCodeUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const unlockingRef = useRef(false);

  const finishUnlock = useCallback(async () => {
    if (!reportId || unlockingRef.current) return;
    unlockingRef.current = true;
    setGenerating(true);
    setError("");
    try {
      const generated = await generateFullReport(reportId);
      if (!validateReportCompliance(generated.fullReport)) {
        throw new Error("报告合规检查未通过，请重新生成");
      }
      setFullReport(generated.fullReport);
      navigate("/report");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "完整报告生成失败");
      setGenerating(false);
      unlockingRef.current = false;
    }
  }, [navigate, reportId, setFullReport]);

  const applyPayment = useCallback((payment: PaymentInitialization) => {
    setPaymentMode(payment.paymentMode);
    setCodeUrl(payment.codeUrl);
    if (payment.status === "paid") void finishUnlock();
  }, [finishUnlock]);

  const prepareOrder = useCallback(async () => {
    if (!profileId || !reportId) return;
    setPreparing(true);
    setError("");
    const createNewOrder = async () => {
      const payment = await createOrder(profileId, reportId);
      setOrderId(payment.orderId);
      applyPayment(payment);
    };
    try {
      if (orderId) {
        try {
          const status = await getOrderPaymentStatus(orderId);
          if (status.status === "paid") {
            setPaymentMode(status.paymentMode);
            await finishUnlock();
            return;
          }
          applyPayment(await initializeOrderPayment(orderId));
        } catch (requestError) {
          if (requestError instanceof ApiError && requestError.code === "ORDER_NOT_FOUND") {
            await createNewOrder();
          } else {
            throw requestError;
          }
        }
      } else {
        await createNewOrder();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "支付订单创建失败");
    } finally {
      setPreparing(false);
    }
  }, [applyPayment, finishUnlock, orderId, profileId, reportId, setOrderId]);

  useEffect(() => {
    void prepareOrder();
  }, [prepareOrder]);

  useEffect(() => {
    if (!codeUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(codeUrl, {
      width: 440,
      margin: 1,
      color: { dark: "#071019", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setQrDataUrl)
      .catch(() => setError("支付二维码生成失败，请刷新重试"));
  }, [codeUrl]);

  useEffect(() => {
    if (!generating) {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [generating]);

  useEffect(() => {
    if (!orderId || paymentMode !== "wechat_native" || generating) return;
    const check = async () => {
      try {
        const status = await getOrderPaymentStatus(orderId);
        if (status.status === "paid") await finishUnlock();
      } catch {
        // Keep polling; a temporary network failure should not interrupt payment.
      }
    };
    const timer = window.setInterval(() => void check(), 2500);
    return () => window.clearInterval(timer);
  }, [finishUnlock, generating, orderId, paymentMode]);

  if (!profileId || !reportId) return <Navigate to="/score" replace />;

  const developmentUnlock = async () => {
    if (!orderId || generating) return;
    setError("");
    try {
      await markOrderPaid(orderId);
      await finishUnlock();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "测试付款失败");
    }
  };

  const checkPaymentNow = async () => {
    if (!orderId) return;
    setError("");
    try {
      const status = await getOrderPaymentStatus(orderId);
      if (status.status === "paid") {
        await finishUnlock();
      } else {
        setError("暂未收到微信支付结果。完成支付后页面会自动更新。");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "支付状态查询失败");
    }
  };

  const isWechat = paymentMode === "wechat_native";

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-16">
      <BackButton to="/result" label="返回免费报告" />
      <div className="mx-auto mt-10 grid max-w-4xl gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="panel p-6 sm:p-8">
          <span className="eyebrow">Unlock report</span>
          <h1 className="mt-6 font-display text-3xl font-semibold">完整专业风险评估报告</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            在初步方向之上，进一步拆解专业适配、风险条件与冲稳保策略。
          </p>
          <div className="mt-8 border-t border-white/[0.08]">
            {[
              "专业推荐池与推荐理由",
              "谨慎专业与可考虑条件",
              "位次策略与冲稳保逻辑",
              "考研、考公、本科就业路径",
              "完整报告内 20 次 AI 追问",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-white/[0.07] py-4 text-sm text-slate-300">
                <Check size={15} className="text-acid" /> {item}
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-end justify-between">
            <span className="text-xs text-slate-500">一次性解锁</span>
            <div><span className="text-sm text-slate-500">¥</span><span className="font-mono text-4xl font-semibold">19.9</span></div>
          </div>
        </div>

        <div className="border border-cyan/20 bg-cyan/[0.035] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CreditCard size={19} className="text-cyan" />
            <h2 className="font-display font-semibold">
              {isWechat ? "微信扫码支付" : "开发环境支付"}
            </h2>
          </div>

          <div className="mx-auto mt-7 grid aspect-square max-w-[230px] place-items-center border border-white/15 bg-white/[0.025] p-3">
            {generating ? (
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                >
                  <BrainCircuit size={70} strokeWidth={1} className="mx-auto text-cyan" />
                </motion.div>
                <div className="mt-4 text-xs text-slate-500">正在生成完整报告 · {elapsed}s</div>
              </div>
            ) : isWechat && qrDataUrl ? (
              <img src={qrDataUrl} alt="微信支付二维码" className="h-full w-full object-contain" />
            ) : (
              <div className="text-center">
                <Smartphone size={62} strokeWidth={1} className="mx-auto text-slate-600" />
                <div className="mt-4 text-xs text-slate-500">
                  {preparing ? "正在创建支付订单…" : orderId ? `订单 ${orderId.slice(0, 8)}` : "订单等待重试"}
                </div>
              </div>
            )}
          </div>

          {isWechat && !generating && (
            <div className="mt-5 text-center">
              <div className="text-sm text-slate-300">请使用微信扫描二维码完成支付</div>
              <div className="mt-2 text-[11px] leading-5 text-slate-600">
                支付成功后自动生成报告，请保持页面打开
              </div>
            </div>
          )}

          {generating && (
            <div className="mt-5">
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{elapsed < 12 ? "确认支付与报告权限" : elapsed < 28 ? "深度分析专业与路径" : "整理完整决策报告"}</span>
                <span>通常约 35 秒，繁忙时更久</span>
              </div>
              <div className="mt-2 h-1 overflow-hidden bg-white/[0.07]">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan to-acid"
                  animate={{ width: `${Math.min(94, 8 + elapsed * 2.35)}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="mt-5 border border-amber-300/20 bg-amber-300/[0.05] p-4 text-xs text-amber-100">
              <div className="flex gap-2"><AlertCircle size={15} className="shrink-0" /> {error}</div>
            </div>
          )}

          {!generating && (
            <motion.button
              type="button"
              whileHover={!preparing ? { y: -2 } : undefined}
              whileTap={!preparing ? { scale: 0.99 } : undefined}
              onClick={isWechat ? checkPaymentNow : developmentUnlock}
              disabled={preparing || !orderId}
              className="mt-6 flex h-[52px] w-full items-center justify-center gap-2 bg-acid font-semibold text-ink shadow-acid disabled:cursor-wait disabled:opacity-60"
            >
              {preparing
                ? "正在创建订单…"
                : isWechat
                  ? "我已完成支付，立即检查"
                  : "测试付款并生成报告"}
            </motion.button>
          )}

          <button
            type="button"
            onClick={prepareOrder}
            disabled={preparing || generating}
            className="mx-auto mt-4 flex items-center gap-2 text-[11px] text-slate-500 hover:text-white disabled:opacity-40"
          >
            <RefreshCw size={13} /> 刷新支付订单
          </button>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600">
            <ShieldCheck size={13} />
            {isWechat ? "支付结果由微信支付回调确认" : "尚未配置微信凭证，当前为本地测试模式"}
          </div>
        </div>
      </div>
    </section>
  );
}
