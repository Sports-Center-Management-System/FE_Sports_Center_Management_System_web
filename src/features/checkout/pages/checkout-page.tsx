import React, { useEffect, useRef } from "react";
import { Link, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { io } from "socket.io-client";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { apiOrigin, errorText, get, money, post, readTokens } from "@/lib/api";
import { clearRetryKey, retryKey } from "@/lib/checkout";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Checkout, CheckoutStatus } from "@/lib/types";

function isPending(status: CheckoutStatus) {
  return status === "PENDING_PAYMENT";
}

function needsPolling(status?: CheckoutStatus) {
  return status === "PENDING_PAYMENT" || status === "PAYMENT_REVIEW" || status === "REFUND_PENDING";
}

export const CheckoutPage: React.FC = () => {
  const { checkoutId = "" } = useParams();
  const { user } = useSession();
  const cache = useQueryClient();
  const lastStatus = useRef<CheckoutStatus | null>(null);

  const order = useQuery({
    queryKey: memberKeys.checkout(user!.id, checkoutId),
    queryFn: () => get<Checkout>(`/billing/checkouts/${checkoutId}`),
    refetchInterval: (queryState) => (needsPolling(queryState.state.data?.status) ? 5000 : false),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

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

  const snapshot = order.data?.priceSnapshot;
  const preview = sessionStorage.getItem(`sportscenter.quote:${checkoutId}`);
  const changed = Boolean(preview && order.data && Number(preview) !== Number(order.data.amount));
  const demoEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCK_PAYMENT === "true";
  const mockUrl =
    (import.meta.env.VITE_PUBLIC_WEB_URL || window.location.origin).replace(/\/$/, "") +
    "/mock-payment";

  return (
    <>
      <PageTitle eyebrow="MEM-04 · CHECKOUT" title="Trạng thái thanh toán" />
      <StateMessage
        loading={order.isPending}
        error={order.error}
        onRetry={() => void order.refetch()}
      />
      {order.data && (
        <div className="two-column">
          <article className="card">
            <p className="eyebrow">ĐƠN {order.data.checkoutId}</p>
            <h2>{String(snapshot?.planName ?? order.data.kind)}</h2>
            <p>
              <span className={`status status-${order.data.status.toLowerCase()}`}>
                {order.data.status}
              </span>
            </p>
            <p>
              Giá gốc: {money(order.data.baseAmount)} · PT: {money(order.data.ptAmount)}
            </p>
            <p className="price">{money(order.data.amount)}</p>
            {changed && (
              <p className="notice warning">
                Giá tại checkout khác báo giá xem trước. Hãy kiểm tra số tiền trước khi thanh toán.
              </p>
            )}
            <p className="muted">
              Snapshot từ máy chủ · hết hạn {vietnamDate(order.data.expiresAt)}
            </p>
            {order.data.failureReason && <p className="text-error">{order.data.failureReason}</p>}
            {order.data.status === "FULFILLED" && (
              <p role="status" className="notice success">
                Thanh toán đã được máy chủ xác nhận. Gói tập và hóa đơn đã được cập nhật.
              </p>
            )}
            <div className="button-row">
              {order.data.status === "PAYMENT_FAILED" && (
                <Button
                  type="button"
                  variant="mint"
                  disabled={retry.isPending}
                  onClick={() => retry.mutate()}
                >
                  Thử thanh toán lại
                </Button>
              )}
              {isPending(order.data.status) && (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={reconcile.isPending}
                  onClick={() => reconcile.mutate()}
                >
                  Kiểm tra lại thanh toán
                </Button>
              )}
            </div>
            {(retry.error || reconcile.error) && (
              <p role="alert" className="text-error">
                {errorText(retry.error ?? reconcile.error)}
              </p>
            )}
            {order.data.status === "FULFILLED" && (
              <div className="button-row">
                <Link className="button" to="/portal/member/subscriptions">
                  Xem gói tập
                </Link>
                <Link className="button secondary" to="/portal/member/invoices">
                  Xem hóa đơn
                </Link>
              </div>
            )}
          </article>
          {isPending(order.data.status) && !demoEnabled && (
            <p className="notice warning">
              Kênh thanh toán demo chưa được bật trong môi trường này.
            </p>
          )}
          {isPending(order.data.status) && order.data.paymentId && demoEnabled && (
            <article className="card payment-card">
              <h2>Thanh toán demo</h2>
              <p>Quét mã QR để mở trang Mock Payment trên điện thoại, rồi nhập payment ID.</p>
              <div className="qr">
                <QRCodeSVG value={mockUrl} size={180} />
              </div>
              <p className="payment-id">{order.data.paymentId}</p>
              <p className="muted">QR chỉ chứa đường dẫn trang. Trình duyệt không gọi webhook.</p>
              <Link to="/mock-payment" target="_blank">
                Mở Mock Payment
              </Link>
            </article>
          )}
        </div>
      )}
    </>
  );
};

export default CheckoutPage;
