import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Dumbbell,
  Users,
  UserCheck,
  CreditCard,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { MembershipPlan } from "../types/subscriptions.types";
import {
  createCheckoutApi,
  simulatePaymentApi,
} from "../services/subscriptions-api.service";

interface PurchasePlanModalProps {
  plan: MembershipPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export const PurchasePlanModal: React.FC<PurchasePlanModalProps> = ({
  plan,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!plan) return null;

  const isVip = plan.packageTier === "VIP";

  const handleConfirmPurchase = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Create checkout
      const checkout = await createCheckoutApi({
        kind: "NEW_SUBSCRIPTION",
        planId: plan.id,
      });

      // Step 2: If payment is required and paymentId returned, simulate payment
      if (checkout.paymentId && checkout.status === "PENDING_PAYMENT") {
        await simulatePaymentApi(checkout.paymentId, "SUCCESS");
      }

      setSuccessMsg("Đăng ký gói tập thành công! Hợp đồng đã được kích hoạt trên hệ thống.");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Purchase failed:", err);
      setError("Không thể đăng ký gói tập. Vui lòng kiểm tra lại điều kiện tài khoản hoặc liên hệ Lễ tân.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`p-6 border-b border-slate-100 flex items-start justify-between ${
            isVip
              ? "bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-amber-500/5"
              : "bg-gradient-to-r from-emerald-500/10 via-emerald-100/20 to-emerald-500/5"
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isVip
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-emerald-100 text-[#008b74] border-emerald-300"
                }`}
              >
                Hạng {plan.packageTier}
              </span>
              {plan.discipline && (
                <span className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {plan.discipline.name}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {plan.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition"
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

          {/* Pricing Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Giá cước thanh toán
              </span>
              <span className="text-2xl font-black text-slate-900">
                {formatCurrency(plan.price)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                Thời hạn gói
              </span>
              <span className="text-base font-bold text-slate-800">
                {plan.durationDays >= 365 ? "Không giới hạn" : `${plan.durationDays} ngày`}
              </span>
            </div>
          </div>

          {/* Quotas checklist */}
          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
              Quyền lợi kích hoạt ngay:
            </h4>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0" />
                <span>
                  Lớp nhóm:{" "}
                  <strong className="text-slate-900">
                    {plan.groupSessionQuota > 0 ? `${plan.groupSessionQuota} buổi học nhóm` : "Không có lớp nhóm"}
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0" />
                <span>
                  Buổi 1:1 cùng Coach:{" "}
                  <strong className="text-slate-900">
                    {plan.ptSessionQuota > 0 ? `${plan.ptSessionQuota} buổi kèm riêng PT` : "Không kèm riêng 1:1"}
                  </strong>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008b74] shrink-0" />
                <span>
                  Vào cửa phòng Gym:{" "}
                  <strong className="text-slate-900">
                    {plan.unlimitedGymEntry ? "Không giới hạn số lượt" : "Theo ca lớp đăng ký"}
                  </strong>
                </span>
              </li>
            </ul>
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
            onClick={handleConfirmPurchase}
            disabled={loading || Boolean(successMsg)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-sm transition disabled:opacity-50 ${
              isVip
                ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                : "bg-[#008b74] hover:bg-[#007562] shadow-[#008b74]/30"
            }`}
          >
            {loading ? (
              <span>Đang xử lý kích hoạt...</span>
            ) : (
              <>
                <CreditCard className="w-3.5 h-3.5" />
                <span>Xác nhận đăng ký & Kích hoạt</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
