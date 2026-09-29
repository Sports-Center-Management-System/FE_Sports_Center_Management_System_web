import React, { useState } from "react";
import {
  X,
  RotateCw,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
} from "lucide-react";
import { UserSubscription } from "../types/subscriptions.types";
import {
  createCheckoutApi,
  simulatePaymentApi,
} from "../services/subscriptions-api.service";

interface RenewModalProps {
  subscription: UserSubscription | null;
  onClose: () => void;
  onSuccess: () => void;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export const RenewModal: React.FC<RenewModalProps> = ({
  subscription,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!subscription) return null;

  const plan = subscription.plan;
  const currentEnd = new Date(subscription.endDate);
  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + (plan?.durationDays ?? 30));

  const handleConfirmRenew = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Create checkout order for renewal
      const checkout = await createCheckoutApi({
        kind: "RENEWAL",
        subscriptionId: subscription.id,
      });

      // Step 2: If payment is required and paymentId returned, simulate payment
      if (checkout.paymentId && checkout.status === "PENDING_PAYMENT") {
        await simulatePaymentApi(checkout.paymentId, "SUCCESS");
      }

      setSuccessMsg("Gia hạn gói tập thành công! Thời hạn gói đã được cộng dồn trên hệ thống.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Renewal failed:", err);
      setError("Không thể thực hiện gia hạn gói tập. Vui lòng thử lại hoặc liên hệ Lễ tân.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-[#008b74] border border-emerald-300 mb-2">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Gia hạn hợp đồng hội viên</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {plan?.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Mã subscription: <span className="font-mono">{subscription.id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[#008b74] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008b74]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Renewal Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
              <span className="text-slate-500">Giá gia hạn niêm yết:</span>
              <span className="text-lg font-black text-slate-900">
                {formatCurrency(plan?.price ?? 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Thời hạn gia hạn cộng thêm:</span>
              <span className="font-semibold text-slate-800">
                +{plan?.durationDays ?? 30} ngày
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Hạn sử dụng hiện tại:</span>
              <span className="font-semibold text-slate-800">
                {formatDate(subscription.endDate)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/70">
              <span className="font-bold text-[#008b74]">Hạn mới sau khi gia hạn:</span>
              <span className="font-bold text-[#008b74] text-sm">
                {formatDate(newEnd.toISOString())}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-slate-600 space-y-1">
            <div className="font-semibold text-[#008b74] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quy chế cộng dồn hạn ngạch</span>
            </div>
            <p>
              Số buổi tập lớp nhóm và buổi PT kèm 1:1 theo gói sẽ được cộng dồn trực tiếp vào tài khoản hội viên và thời hạn mới được nối tiếp ngay sau ngày hết hạn hiện tại.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 transition"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirmRenew}
            disabled={loading || Boolean(successMsg)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#008b74] hover:bg-[#007562] text-white shadow-sm shadow-[#008b74]/30 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xử lý gia hạn...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Xác nhận gia hạn gói</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
