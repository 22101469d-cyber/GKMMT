import { HttpError } from "../lib/httpError.js";
import { repository } from "../lib/repository.js";
import { config } from "../lib/config.js";
import { initiateOrderPayment } from "./paymentService.js";

export async function createOrder(input: {
  profileId: string;
  reportId: string;
}) {
  const [profile, report] = await Promise.all([
    repository.getProfile(input.profileId),
    repository.getReport(input.reportId),
  ]);
  if (!profile) throw new HttpError(404, "Profile not found", "PROFILE_NOT_FOUND");
  if (!report) throw new HttpError(404, "Report not found", "REPORT_NOT_FOUND");
  if (report.profileId !== profile.id) {
    throw new HttpError(400, "Report does not belong to profile", "PROFILE_REPORT_MISMATCH");
  }
  const order = await repository.createOrder({
    ...input,
    amount: config.REPORT_PRICE_FEN,
    paymentMethod: config.WECHAT_PAY_ENABLED ? "wechat_native" : "manual",
  });
  return initiateOrderPayment(order.id);
}

export async function markOrderPaid(orderId: string) {
  const order = await repository.markOrderPaid(orderId);
  await repository.ensureUsageLimit(order);
  await repository.createAdminLog({
    action: "mark_order_paid",
    targetType: "order",
    targetId: order.id,
    note: "Manual payment confirmation through an authorized admin or local development route.",
  });
  return order;
}
