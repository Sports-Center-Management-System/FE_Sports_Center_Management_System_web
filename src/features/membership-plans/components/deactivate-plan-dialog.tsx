import React, { useState } from "react";
import { MembershipPlan } from "../types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Ban, ShieldCheck } from "lucide-react";

export interface DeactivatePlanDialogProps {
  plan: MembershipPlan | null;
  open: boolean;
  onClose: () => void;
  onConfirmDeactivate: (planId: string, reason: string) => void;
}

const DEACTIVATE_REASONS = [
  "Ngừng kinh doanh theo định hướng mùa giải mới",
  "Tái cấu trúc lại quyền lợi và giá gói cước",
  "Gói khuyến mãi có hạn đã hết thời gian áp dụng",
  "Thay thế bằng phiên bản gói cước mới",
  "Lý do khác",
];

export const DeactivatePlanDialog: React.FC<DeactivatePlanDialogProps> = ({
  plan,
  open,
  onClose,
  onConfirmDeactivate,
}) => {
  if (!open || !plan) return null;

  const [reason, setReason] = useState(DEACTIVATE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = () => {
    setIsSubmitting(true);
    const finalReason = reason === "Lý do khác" && customReason.trim() ? customReason : reason;

    setTimeout(() => {
      onConfirmDeactivate(plan.id, finalReason);
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">
              Ngừng Kinh Doanh Gói Cước (DELETE)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan Overview */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-[#008b74] bg-[#e6f7f2] px-2 py-0.5 rounded">
              {plan.code}
            </span>
            <span className="font-semibold text-slate-600">{plan.disciplineName}</span>
          </div>
          <p className="mt-2 font-bold text-slate-900 text-sm">{plan.name}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Hạng vé: {plan.tierLabel} • Thời hạn: {plan.durationDays} ngày
          </p>
        </div>

        {/* Soft-delete Explanation Banner */}
        <div className="mt-3 rounded-xl bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Cơ chế Soft-Delete:</strong> Hệ thống chuyển cờ <code className="bg-amber-100/80 px-1 rounded font-mono font-bold">is_active = FALSE</code>. Gói cước sẽ ngừng xuất hiện trên quầy lễ tân nhưng <strong>bảo toàn 100% lịch sử các hợp đồng hội viên đã mua trước đây</strong>.
          </div>
        </div>

        {/* Reason Selector */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
            Lý do ngừng kinh doanh
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
          >
            {DEACTIVATE_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {reason === "Lý do khác" && (
            <input
              type="text"
              placeholder="Nhập chi tiết lý do..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Giữ lại gói
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="font-bold shadow-xs flex items-center gap-1.5"
          >
            <Ban className="h-3.5 w-3.5" />
            {isSubmitting ? "Đang xử lý..." : "Xác nhận ngừng bán (Soft-Delete)"}
          </Button>
        </div>
      </div>
    </div>
  );
};
