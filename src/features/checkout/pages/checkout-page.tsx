import React, { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { useSession } from "@/auth/session-context";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { apiOrigin, errorText, get, money, post, readTokens } from "@/lib/api";
import { clearRetryKey, retryKey } from "@/lib/checkout";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Checkout, CheckoutStatus, Coach } from "@/lib/types";
import {
  formatCheckoutKind,
  formatCheckoutStatus,
  formatPlanName,
  formatTierLabel,
} from "@/features/plans/lib/plan-formatter";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Loader2,
  CreditCard,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

function isPending(status: CheckoutStatus) {
  return status === "PENDING_PAYMENT";
}

function needsPolling(status?: CheckoutStatus) {
  return status === "PENDING_PAYMENT" || status === "PAYMENT_REVIEW" || status === "REFUND_PENDING";
}

interface SnapshotData {
  planName?: string;
  planId?: string;
  disciplineId?: string;
  packageTier?: string;
  ptQuota?: number;
  groupQuota?: number;
  durationDays?: number;
  unlimitedGymEntry?: boolean;
  coachId?: string;
  ratePerSession?: string;
  addonSessions?: number;
  subscriptionId?: string;
}

export const CheckoutPage: React.FC = () => {
  const { checkoutId = "" } = useParams();
  const { user } = useSession();
  const cache = useQueryClient();
  const lastStatus = useRef<CheckoutStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const order = useQuery({
    queryKey: memberKeys.checkout(user!.id, checkoutId),
    queryFn: () => get<Checkout>(`/billing/checkouts/${checkoutId}`),
    refetchInterval: (queryState) => (needsPolling(queryState.state.data?.status) ? 5000 : false),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const snapshot = order.data?.priceSnapshot as SnapshotData | undefined;

  const coaches = useQuery({
    queryKey: ["coaches"],
    queryFn: () => get<Coach[]>("/coaches"),
    enabled: Boolean(snapshot?.coachId),
  });

  const assignedCoach = coaches.data?.find((c) => c.id === snapshot?.coachId);

  useEffect(() => {
    const token = readTokens()?.accessToken;
    if (!token) return;
    const socket = io(`${apiOrigin()}/realtime`, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const invalidate = (event: { checkoutId?: string }) => {
      if (event.checkoutId === checkoutId)
        void cache.invalidateQueries({ queryKey: memberKeys.checkout(user!.id, checkoutId) });
    };

    socket.on("checkout.updated", invalidate);
    socket.on("connect", () => {
      void cache.invalidateQueries({ queryKey: memberKeys.checkout(user!.id, checkoutId) });
    });

    return () => {
      socket.off("checkout.updated", invalidate);
      socket.disconnect();
    };
  }, [checkoutId, user, cache]);

  useEffect(() => {
    if (!order.data || lastStatus.current === order.data.status) return;
    lastStatus.current = order.data.status;
    if (order.data.status === "FULFILLED") {
      void Promise.all([
        cache.invalidateQueries({ queryKey: memberKeys.subscriptions(user!.id) }),
        cache.invalidateQueries({ queryKey: memberKeys.invoices(user!.id) }),
        cache.invalidateQueries({ queryKey: memberKeys.transactions(user!.id) }),
        cache.invalidateQueries({ queryKey: ["member", user!.id, "calendar"] }),
      ]);
    }
  }, [order.data, cache, user]);

  const retry = useMutation({
    mutationFn: () =>
      post<Checkout>(
        `/billing/checkouts/${checkoutId}/retry`,
        {},
        { "Idempotency-Key": retryKey(checkoutId) }
      ),
    onSuccess: () => {
      clearRetryKey(checkoutId);
      void order.refetch();
    },
  });

  const reconcile = useMutation({
    mutationFn: () => post<Checkout>(`/billing/checkouts/${checkoutId}/reconcile`, {}),
    onSuccess: () => void order.refetch(),
  });

  const handleCopyPaymentId = () => {
    if (!order.data?.paymentId) return;
    void navigator.clipboard.writeText(order.data.paymentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = sessionStorage.getItem(`sportscenter.quote:${checkoutId}`);
  const changed = Boolean(preview && order.data && Number(preview) !== Number(order.data.amount));
  const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_PAYMENT === "true";
  const mockUrl =
    (import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin).replace(/\/$/, "") +
    "/mock-payment";

  const rawPlanName = String(snapshot?.planName ?? order.data?.kind ?? "Gói tập");
  const planName = formatPlanName(rawPlanName);
  const statusMeta = formatCheckoutStatus(order.data?.status);
  const kindLabel = formatCheckoutKind(order.data?.kind);

  // Compute breakdown descriptions in concise Vietnamese
  const planPerks: string[] = [];
  if (snapshot?.durationDays) {
    planPerks.push(`${snapshot.durationDays} ngày hiệu lực`);
  }
  if (snapshot?.unlimitedGymEntry) {
    planPerks.push("Ra vào phòng tập tự do 24/7");
  }
  if (snapshot?.groupQuota) {
    planPerks.push(`${snapshot.groupQuota} buổi lớp nhóm`);
  }
  const perksText = planPerks.length > 0 ? planPerks.join(" · ") : "Quyền lợi hội viên tiêu chuẩn";

  const ptCount = Number(snapshot?.ptQuota ?? snapshot?.addonSessions ?? 0);
  const hasPt = Number(order.data?.ptAmount || 0) > 0 || ptCount > 0;
  const ptPerks: string[] = [];
  if (ptCount > 0) {
    ptPerks.push(`${ptCount} buổi kèm 1:1`);
  }
  if (assignedCoach?.fullName) {
    ptPerks.push(`HLV: ${assignedCoach.fullName}`);
  } else if (snapshot?.coachId) {
    ptPerks.push("Huấn luyện viên kèm riêng");
  }
  if (snapshot?.ratePerSession) {
    ptPerks.push(`(${money(String(snapshot.ratePerSession))}/buổi)`);
  }
  const ptText = ptPerks.length > 0 ? ptPerks.join(" · ") : "Huấn luyện viên cá nhân kèm riêng";

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 space-y-6 pb-20">
      {/* Top Bar: Back Button & Order Reference */}
      <div className="flex items-center justify-between gap-4">
        <Link
          to="/portal/member/plans"
          className="h-9 px-3.5 rounded-md bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 inline-flex items-center gap-2 text-xs font-bold transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
          title="Quay lại danh mục gói tập"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>Quay lại danh mục gói</span>
        </Link>

        {order.data && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="font-semibold text-slate-600 hidden sm:inline">Số chứng từ:</span>
            <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-900 font-bold select-all">
              #{order.data.checkoutId.slice(0, 16).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <StateMessage
        loading={order.isPending}
        error={order.error}
        onRetry={() => void order.refetch()}
      />

      {order.data && (
        <article className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden text-slate-900">
          {/* 1. Invoice Header Banner */}
          <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-[#008b74] text-white flex items-center justify-center font-black text-xs tracking-wider shadow-2xs">
                    3TC
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                      3TC Fitness Center
                    </h3>
                    <p className="text-[11px] text-slate-500">Trung tâm Thể dục Thể thao & Thể hình</p>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                    Phiếu xác nhận đơn hàng & hóa đơn dịch vụ
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                    {planName}
                  </h1>
                </div>
              </div>

              {/* Status Badge & Tier Chips */}
              <div className="flex flex-col sm:items-end gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status Badge */}
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold tracking-wide border shadow-2xs",
                      statusMeta.variant === "success" && "bg-emerald-50 text-emerald-800 border-emerald-300",
                      statusMeta.variant === "pending" && "bg-amber-50 text-amber-900 border-amber-300",
                      statusMeta.variant === "failed" && "bg-rose-50 text-rose-900 border-rose-300",
                      statusMeta.variant === "neutral" && "bg-slate-100 text-slate-800 border-slate-300"
                    )}
                  >
                    {statusMeta.variant === "pending" && <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />}
                    {statusMeta.variant === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    {statusMeta.variant === "failed" && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                    <span>{statusMeta.label}</span>
                  </span>

                  {/* Tier Badge translated */}
                  {snapshot?.packageTier && (
                    <span className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-slate-900 text-white shadow-2xs">
                      {formatTierLabel(snapshot.packageTier)}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Loại giao dịch: <strong className="text-slate-800">{kindLabel}</strong>
                </p>
              </div>
            </div>

            {/* Structured 4-Col Meta Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Hội viên đăng ký</span>
                <strong className="text-slate-900 text-sm font-semibold truncate block mt-0.5">
                  {user?.fullName || user?.email || "Hội viên"}
                </strong>
                <span className="text-slate-500 text-[11px] truncate block">{user?.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Mã đơn thanh toán</span>
                <strong className="text-slate-900 font-mono text-xs block select-all mt-0.5 break-all">
                  {order.data.checkoutId}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Thời gian lập</span>
                <strong className="text-slate-800 block mt-0.5">
                  {vietnamDate(order.data.createdAt || new Date().toISOString())}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Hạn thanh toán</span>
                <strong className="text-slate-800 block mt-0.5">
                  {vietnamDate(order.data.expiresAt)}
                </strong>
              </div>
            </div>
          </div>

          {/* 2. Detailed Line Items Table */}
          <div className="p-6 sm:p-8">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Chi tiết các hạng mục thanh toán
            </h4>

            <div className="overflow-x-auto rounded-md border border-slate-200">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 text-center w-12">STT</th>
                    <th className="py-3 px-4">Hạng mục dịch vụ & Quyền lợi</th>
                    <th className="py-3 px-4 text-center w-44">Số lượng / Thời hạn</th>
                    <th className="py-3 px-4 text-right w-44">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  <tr>
                    <td className="py-4 px-4 text-center text-slate-400 font-mono font-bold text-xs">01</td>
                    <td className="py-4 px-4">
                      <p className="font-bold text-slate-900 text-base">{planName}</p>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{perksText}</p>
                    </td>
                    <td className="py-4 px-4 text-center text-slate-700 font-medium whitespace-nowrap">
                      1 gói ({snapshot?.durationDays ? `${snapshot.durationDays} ngày` : "Tiêu chuẩn"})
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono text-base whitespace-nowrap">
                      {money(order.data.baseAmount)}
                    </td>
                  </tr>

                  {hasPt && (
                    <tr>
                      <td className="py-4 px-4 text-center text-slate-400 font-mono font-bold text-xs">02</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-slate-900 text-base">Huấn luyện viên cá nhân (PT 1:1) kèm riêng</p>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ptText}</p>
                      </td>
                      <td className="py-4 px-4 text-center text-slate-700 font-medium whitespace-nowrap">
                        {ptCount} buổi kèm riêng
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-slate-900 font-mono text-base whitespace-nowrap">
                        {money(order.data.ptAmount)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Financial Summary & Settlement Row */}
            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left / Center Summary */}
              <div className="md:col-span-6 space-y-3">
                <div className="bg-slate-50/80 rounded-lg p-5 border border-slate-200 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Giá niêm yết gói tập:</span>
                    <span className="font-bold text-slate-900 font-mono">{money(order.data.baseAmount)}</span>
                  </div>

                  {hasPt && (
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>Phí dịch vụ Huấn luyện viên kèm riêng:</span>
                      <span className="font-bold text-slate-900 font-mono">{money(order.data.ptAmount)}</span>
                    </div>
                  )}

                  {changed && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs">
                      Giá tại bước thanh toán có cập nhật so với báo giá xem trước. Vui lòng kiểm tra kỹ số tiền.
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 flex items-baseline justify-between">
                    <span className="font-black text-slate-900 text-base uppercase tracking-wide">
                      Tổng tiền thanh toán:
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-[#008b74] font-mono tracking-tight">
                      {money(order.data.amount)}
                    </span>
                  </div>
                </div>

                {/* Primary Action Button Bar */}
                <div className="space-y-2 pt-2">
                  {order.data.status === "PAYMENT_FAILED" && (
                    <Button
                      type="button"
                      variant="default"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate()}
                      className="w-full h-11 rounded-md bg-slate-900 hover:bg-black text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {retry.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>Thử thanh toán lại</span>
                    </Button>
                  )}

                  {isPending(order.data.status) && (
                    <Button
                      type="button"
                      variant="default"
                      disabled={reconcile.isPending}
                      onClick={() => reconcile.mutate()}
                      className="w-full h-11 rounded-md bg-[#008b74] hover:bg-[#007360] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {reconcile.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      <span>Kiểm tra & Cập nhật thanh toán</span>
                    </Button>
                  )}

                  {order.data.status === "FULFILLED" && (
                    <div className="flex flex-col sm:flex-row gap-3 w-full">
                      <Link
                        className="flex-1 h-11 rounded-md bg-[#008b74] hover:bg-[#007360] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm transition-all"
                        to="/portal/member/subscriptions"
                      >
                        <span>Vào gói tập của tôi</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        className="flex-1 h-11 rounded-md bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-sm tracking-wide flex items-center justify-center gap-2 shadow-2xs transition-all"
                        to="/portal/member/invoices"
                      >
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span>Xem lịch sử hóa đơn</span>
                      </Link>
                    </div>
                  )}

                  {(retry.error || reconcile.error) && (
                    <p role="alert" className="text-xs text-rose-700 font-semibold mt-1">
                      {errorText(retry.error ?? reconcile.error)}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Side: QR Code / Payment Instructions */}
              <div className="md:col-span-6">
                {isPending(order.data.status) && demoEnabled && order.data.paymentId && (
                  <div className="bg-slate-50/80 rounded-lg border border-slate-200 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#008b74]" />
                        <span>Kênh thanh toán trực tuyến</span>
                      </span>
                      <Link
                        to="/mock-payment"
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#008b74] hover:underline"
                      >
                        <span>Mở trang thanh toán</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                      {/* Large Crisp QR Code */}
                      <div className="p-3 bg-white rounded-md border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center">
                        <QRCodeSVG value={mockUrl} size={140} />
                      </div>

                      {/* Payment ID & instructions */}
                      <div className="flex-1 min-w-0 space-y-2 text-left w-full">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Quét mã QR bằng ứng dụng ngân hàng hoặc sao chép mã <strong>Payment ID</strong> để hoàn tất:
                        </p>

                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-500 block uppercase">
                            Mã thanh toán (Payment ID):
                          </span>
                          <div className="flex items-center justify-between bg-white border border-slate-300 rounded px-3 py-2">
                            <span className="font-mono font-black text-sm tracking-wider text-slate-950 select-all">
                              {order.data.paymentId}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopyPaymentId}
                              className="px-2 py-1 hover:bg-slate-100 text-slate-700 hover:text-black rounded transition-colors cursor-pointer border border-slate-200 flex items-center gap-1 text-xs font-bold"
                              title="Sao chép Payment ID"
                            >
                              {copied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-emerald-700">Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 leading-snug border-t border-slate-200/80 pt-3">
                      Hệ thống tự động kích hoạt gói tập ngay khi nhận được tín hiệu xác nhận thanh toán thành công.
                    </p>
                  </div>
                )}

                {isPending(order.data.status) && !demoEnabled && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-xs">
                    <p className="m-0 font-medium">
                      Kênh thanh toán trực tuyến hiện đang được kết nối với cổng ngân hàng.
                    </p>
                  </div>
                )}

                {order.data.status === "FULFILLED" && (
                  <div className="bg-emerald-50/70 rounded-lg border border-emerald-200 p-6 flex items-start gap-4 h-full">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-md shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                        ĐÃ HOÀN TẤT THANH TOÁN
                      </div>
                      <h4 className="text-base font-bold text-emerald-950">
                        Gói tập của bạn đã được kích hoạt thành công!
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        Cảm ơn bạn đã lựa chọn 3TC Fitness Center. Bạn có thể sử dụng mã vạch hoặc thẻ hội viên để bắt đầu tập luyện ngay hôm nay.
                      </p>
                    </div>
                  </div>
                )}

                {order.data.status === "PAYMENT_FAILED" && (
                  <div className="bg-rose-50/80 rounded-lg border border-rose-200 p-6 flex items-start gap-4 h-full">
                    <div className="p-2.5 bg-rose-600 text-white rounded-md shrink-0 shadow-2xs">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="inline-block px-2.5 py-0.5 rounded bg-rose-100 text-rose-900 font-bold text-xs uppercase tracking-wider">
                        GIAO DỊCH CHƯA THÀNH CÔNG
                      </div>
                      <h4 className="text-base font-bold text-rose-950">
                        Không thể hoàn tất giao dịch
                      </h4>
                      <p className="text-xs text-rose-800 leading-relaxed">
                        {order.data.failureReason || "Giao dịch không thành công hoặc phiên thanh toán đã hết thời gian hiệu lực. Vui lòng bấm thử lại để tạo phiên thanh toán mới."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </article>
      )}
    </div>
  );
};

export default CheckoutPage;
