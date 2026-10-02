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
} from "lucide-react";

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

  const planName = String(snapshot?.planName ?? order.data?.kind ?? "Gói tập");

  // Compute breakdown descriptions
  const planPerks: string[] = [];
  if (snapshot?.durationDays) {
    planPerks.push(`${snapshot.durationDays} ngày hiệu lực`);
  }
  if (snapshot?.unlimitedGymEntry) {
    planPerks.push("Ra vào phòng tập tự do");
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
    ptPerks.push("HLV kèm riêng");
  }
  if (snapshot?.ratePerSession) {
    ptPerks.push(`(${money(String(snapshot.ratePerSession))}/buổi)`);
  }
  const ptText = ptPerks.length > 0 ? ptPerks.join(" · ") : "Huấn luyện viên cá nhân";

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-[calc(100vh-2.5rem)] sm:h-[calc(100vh-4.5rem)] min-h-0 py-0">
      {/* Top Bar: Sharp-Cornered Back Button & Title */}
      <div className="shrink-0 flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Link
            to="/portal/member/plans"
            className="h-8 px-3 rounded-none bg-white border border-slate-900 hover:bg-slate-100 text-slate-900 inline-flex items-center gap-1.5 text-xs font-bold transition-colors shrink-0"
            title="Quay lại danh mục gói tập"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </Link>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 leading-tight">
            Trạng thái thanh toán
          </h1>
        </div>

        {order.data && (
          <span className="text-[11px] font-mono text-slate-600 uppercase tracking-widest hidden sm:inline-block">
            SỐ CHỨNG TỪ: #{order.data.checkoutId.slice(0, 16).toUpperCase()}
          </span>
        )}
      </div>

      <StateMessage
        loading={order.isPending}
        error={order.error}
        onRetry={() => void order.refetch()}
      />

      {order.data && (
        <article className="card flex-1 min-h-0 flex flex-col justify-between bg-white rounded-none border-2 border-slate-900 p-4 sm:p-5 text-slate-900 shadow-none">
          {/* Invoice Header Block */}
          <div className="shrink-0 flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-slate-900 gap-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-0.5">
                TRUNG TÂM THỂ THAO CAO CẤP · PHIẾU XÁC NHẬN THANH TOÁN
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                {String(snapshot?.planName ?? order.data.kind)}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`status status-${order.data.status.toLowerCase()} inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none font-mono text-xs font-black tracking-wider uppercase ${
                    order.data.status === "FULFILLED"
                      ? "bg-slate-900 text-white border border-slate-900"
                      : "bg-slate-100 text-slate-900 border border-slate-900"
                  }`}
                >
                  {order.data.status === "PENDING_PAYMENT" && (
                    <Clock className="w-3 h-3 text-slate-700 animate-pulse" />
                  )}
                  {order.data.status === "FULFILLED" && (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                  {order.data.status === "PAYMENT_FAILED" && (
                    <AlertCircle className="w-3 h-3 text-rose-700" />
                  )}
                  <span>{order.data.status}</span>
                </span>

                {snapshot?.packageTier && (
                  <span className="px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                    {String(snapshot.packageTier)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-slate-700 space-y-0.5 font-medium">
              <p>
                Hội viên:{" "}
                <strong className="text-slate-900">{user?.fullName ?? user?.email}</strong>
              </p>
              <p>
                Ngày lập:{" "}
                <strong className="text-slate-900">
                  {vietnamDate(order.data.createdAt || new Date().toISOString())}
                </strong>
              </p>
              <p>
                Hết hạn:{" "}
                <strong className="text-slate-900">
                  {vietnamDate(order.data.expiresAt)}
                </strong>
              </p>
            </div>
          </div>

          {/* Full-width Line Items Table with scroll support */}
          <div className="flex-1 min-h-0 overflow-y-auto py-2.5 my-1">
            <table className="w-full text-xs sm:text-sm border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100 text-slate-800 text-[11px] uppercase font-bold tracking-wider text-left sticky top-0 z-10">
                  <th className="border border-slate-300 p-2 text-center w-10 bg-slate-100">STT</th>
                  <th className="border border-slate-300 p-2 bg-slate-100">Hạng mục dịch vụ</th>
                  <th className="border border-slate-300 p-2 text-center w-28 bg-slate-100">Số lượng</th>
                  <th className="border border-slate-300 p-2 text-right w-36 bg-slate-100">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-300 p-2 text-center text-slate-500 font-mono">01</td>
                  <td className="border border-slate-300 p-2">
                    <p className="font-bold text-slate-900">{planName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{perksText}</p>
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-slate-700 font-medium whitespace-nowrap">
                    1 gói ({snapshot?.durationDays ? `${snapshot.durationDays} ngày` : "Tiêu chuẩn"})
                  </td>
                  <td className="border border-slate-300 p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                    {money(order.data.baseAmount)}
                  </td>
                </tr>

                {hasPt && (
                  <tr>
                    <td className="border border-slate-300 p-2 text-center text-slate-500 font-mono">02</td>
                    <td className="border border-slate-300 p-2">
                      <p className="font-bold text-slate-900">Huấn luyện viên cá nhân (PT 1:1) kèm riêng</p>
                      <p className="text-xs text-slate-600 mt-0.5">{ptText}</p>
                    </td>
                    <td className="border border-slate-300 p-2 text-center text-slate-700 font-medium whitespace-nowrap">
                      {ptCount} buổi PT
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-bold text-slate-900 whitespace-nowrap">
                      {money(order.data.ptAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Invoice Bottom: Attached to bottom with Totals on the Left and QR on the Right */}
          <div className="shrink-0 mt-auto pt-3 border-t border-slate-900">
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4">
              {/* Left Column: Financial Totals & CTA */}
              <div className="w-full md:w-80 shrink-0 space-y-1 text-xs text-left">
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Giá gốc gói tập:</span>
                  <span className="font-bold text-slate-900">{money(order.data.baseAmount)}</span>
                </div>

                {hasPt && (
                  <div className="flex justify-between text-slate-700">
                    <span className="font-medium">Phí dịch vụ HLV (PT):</span>
                    <span className="font-bold text-slate-900">{money(order.data.ptAmount)}</span>
                  </div>
                )}

                {changed && (
                  <div className="p-1.5 bg-slate-100 border border-slate-900 text-slate-900 text-[11px] text-left">
                    <p className="notice warning m-0 font-medium">
                      Giá tại checkout khác báo giá xem trước. Hãy kiểm tra lại số tiền.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t-2 border-slate-900 flex items-baseline justify-between">
                  <span className="font-black text-slate-900 text-sm uppercase tracking-wide">
                    Tổng thanh toán:
                  </span>
                  <p
                    className="price text-xl sm:text-2xl font-black !text-slate-950 font-mono m-0 whitespace-nowrap"
                    style={{ color: "#020617" }}
                  >
                    {money(order.data.amount)}
                  </p>
                </div>

                <div className="pt-1.5">
                  {order.data.status === "PAYMENT_FAILED" && (
                    <Button
                      type="button"
                      variant="default"
                      disabled={retry.isPending}
                      onClick={() => retry.mutate()}
                      className="w-full h-10 rounded-none bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-none cursor-pointer"
                    >
                      {retry.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
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
                      className="w-full h-10 rounded-none bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wide flex items-center justify-center gap-2 shadow-none cursor-pointer disabled:opacity-50"
                    >
                      {reconcile.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3.5 h-3.5" />
                      )}
                      <span>Kiểm tra lại thanh toán</span>
                    </Button>
                  )}

                  {order.data.status === "FULFILLED" && (
                    <div className="flex gap-2 w-full">
                      <Link
                        className="button flex-1 h-10 rounded-none bg-slate-900 hover:bg-black text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-none"
                        to="/portal/member/subscriptions"
                      >
                        <span>Xem gói tập</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        className="button secondary flex-1 h-10 rounded-none bg-white border border-slate-900 hover:bg-slate-100 text-slate-900 font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-none"
                        to="/portal/member/invoices"
                      >
                        <span>Xem hóa đơn</span>
                      </Link>
                    </div>
                  )}
                </div>

                {(retry.error || reconcile.error) && (
                  <p role="alert" className="text-error text-[11px] text-rose-700 font-semibold mt-1">
                    {errorText(retry.error ?? reconcile.error)}
                  </p>
                )}
              </div>

              {/* Right Column: QR Payment / Confirmation / Failure */}
              <div className="flex-1 min-w-0 md:max-w-lg ml-auto">
                {isPending(order.data.status) && demoEnabled && order.data.paymentId && (
                  <div className="bg-slate-50 border border-slate-300 p-2.5 sm:p-3 flex flex-col sm:flex-row items-center gap-3.5 h-full">
                    {/* Compact QR Code */}
                    <div className="p-1.5 bg-white border border-slate-900 shrink-0">
                      <QRCodeSVG value={mockUrl} size={96} />
                    </div>

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0 space-y-1.5 text-left w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          THANH TOÁN DEMO (MOCK QR)
                        </span>
                        <Link
                          to="/mock-payment"
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-900 underline hover:text-black"
                        >
                          <span>Mở Mock Payment</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        Quét mã QR bằng điện thoại hoặc sao chép Payment ID bên dưới:
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-between bg-white border border-slate-900 px-2 py-1 flex-1 max-w-[260px]">
                          <span className="payment-id font-mono font-black text-xs tracking-wider text-slate-950 select-all">
                            {order.data.paymentId}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyPaymentId}
                            className="p-0.5 hover:bg-slate-100 text-slate-700 hover:text-black transition-colors cursor-pointer border-l border-slate-200 pl-1.5 ml-1 flex items-center gap-1 text-[10px] font-bold"
                            title="Sao chép Payment ID"
                          >
                            {copied ? (
                              <Check className="w-3 h-3 text-slate-900" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copied ? "Đã chép" : "Chép mã"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isPending(order.data.status) && !demoEnabled && (
                  <div className="p-3 bg-slate-50 border border-slate-300 text-slate-800 text-xs">
                    <p className="notice warning m-0 font-medium">
                      Kênh thanh toán demo chưa được bật trong môi trường này.
                    </p>
                  </div>
                )}

                {order.data.status === "FULFILLED" && (
                  <div className="bg-slate-50 border border-slate-900 p-3 flex items-center gap-3 h-full">
                    <div className="p-2 bg-white border border-slate-900 shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-slate-900" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="border border-slate-900 bg-white px-2 py-0.5 inline-block font-mono font-black text-[10px] uppercase tracking-wider text-slate-900">
                        ĐÃ XÁC NHẬN THANH TOÁN
                      </div>
                      <p role="status" className="notice success text-xs text-slate-800 font-semibold m-0">
                        Thanh toán đã được máy chủ xác nhận. Gói tập và hóa đơn đã được cập nhật.
                      </p>
                    </div>
                  </div>
                )}

                {order.data.status === "PAYMENT_FAILED" && (
                  <div className="bg-slate-50 border border-slate-900 p-3 flex items-center gap-3 h-full">
                    <AlertCircle className="w-6 h-6 text-rose-700 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="font-mono font-black text-xs uppercase tracking-wider text-rose-800 m-0">
                        GIAO DỊCH THẤT BẠI
                      </p>
                      <p className="text-xs text-slate-700 m-0">
                        {order.data.failureReason || "Giao dịch không thành công hoặc phiên thanh toán đã hết hạn."}
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
