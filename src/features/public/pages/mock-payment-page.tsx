import React, { useState } from "react";
import { useSearchParams, Link } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorText, money, post } from "@/lib/api";

export const MockPaymentPage: React.FC = () => {
  const [params] = useSearchParams();
  const [paymentId, setPaymentId] = useState((params.get("paymentId") ?? "").toUpperCase());
  const [details, setDetails] = useState<{
    planName: string;
    amount: string;
    status: string;
    expiresAt: string;
  } | null>(null);
  const [result, setResult] = useState("");

  const lookup = useMutation({
    mutationFn: () =>
      post<{ planName: string; amount: string; status: string; expiresAt: string }>(
        "/dev/mock-payments/lookup",
        { paymentId },
        undefined,
        true
      ),
    onSuccess: setDetails,
  });

  const simulate = useMutation({
    mutationFn: (outcome: "SUCCESS" | "FAILURE") =>
      post<{ status: string }>(
        "/dev/mock-payments/simulate",
        { paymentId, outcome },
        undefined,
        true
      ),
    onSuccess: (value) => {
      setResult(`Máy chủ ghi nhận: ${value.status}`);
      setDetails(null);
    },
  });

  if (!import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_PAYMENT !== "true") {
    return <div className="notice">Mock Payment chỉ có trong môi trường demo.</div>;
  }

  return (
    <section className="auth-card max-w-lg mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/50">
      <p className="eyebrow text-xs font-bold text-[#008b74] uppercase tracking-wider mb-1">
        DEMO PAYMENT
      </p>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Thanh toán giả lập</h1>
      <p className="muted text-xs text-slate-500 mb-6">
        Nhập mã payment ID trên trang checkout. Đây là giao dịch mô phỏng trong môi trường phát triển.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Payment ID</label>
          <Input
            maxLength={16}
            value={paymentId}
            onChange={(event) => {
              setPaymentId(event.target.value.toUpperCase());
              setDetails(null);
            }}
            placeholder="VD: 16 ký tự mã thanh toán"
            className="font-mono text-sm tracking-wider uppercase"
          />
        </div>

        <Button
          type="button"
          variant="mint"
          className="w-full"
          disabled={!/^[A-Z0-9]{16}$/.test(paymentId) || lookup.isPending}
          onClick={() => lookup.mutate()}
        >
          {lookup.isPending ? "Đang tra cứu..." : "Tra cứu thanh toán"}
        </Button>

        {lookup.error && (
          <p role="alert" className="text-error text-xs text-rose-600 font-medium">
            {errorText(lookup.error)}
          </p>
        )}

        {details && (
          <div className="card mt-6 p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <h2 className="text-base font-bold text-slate-900">{details.planName}</h2>
            <p className="text-sm font-semibold text-slate-700">
              {money(details.amount)} · <span className="text-[#008b74]">{details.status}</span>
            </p>
            <p className="text-xs text-slate-500">
              Hết hạn: {new Date(details.expiresAt).toLocaleString("vi-VN")}
            </p>
            <div className="button-row flex gap-3 pt-2">
              <Button
                type="button"
                variant="mint"
                disabled={simulate.isPending || details.status !== "PENDING_PAYMENT"}
                onClick={() => simulate.mutate("SUCCESS")}
              >
                Thanh toán thành công
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={simulate.isPending || details.status !== "PENDING_PAYMENT"}
                onClick={() => simulate.mutate("FAILURE")}
              >
                Thanh toán thất bại
              </Button>
            </div>
          </div>
        )}

        {simulate.error && (
          <p role="alert" className="text-error text-xs text-rose-600 font-medium">
            {errorText(simulate.error)}
          </p>
        )}

        {result && (
          <div role="status" className="notice success p-4 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 mt-4">
            {result}. Quay lại checkout để xem trạng thái từ máy chủ.
          </div>
        )}

        <div className="pt-4 text-center">
          <Link to="/portal/member/transactions" className="text-xs text-[#008b74] hover:underline font-bold">
            Xem lịch sử giao dịch
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MockPaymentPage;
