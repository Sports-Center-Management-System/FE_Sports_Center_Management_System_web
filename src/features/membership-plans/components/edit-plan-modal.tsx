import React, { useState, useEffect } from "react";
import { MembershipPlan, UpdatePlanPayload } from "../types";
import { validateCurriculumRequirements } from "../mock-data";
import { Button } from "@/components/ui/button";
import { X, Edit2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditPlanModalProps {
  plan: MembershipPlan | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: UpdatePlanPayload) => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  plan,
  open,
  onClose,
  onSubmit,
}) => {
  if (!open || !plan) return null;

  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(plan.price);
  const [durationDays, setDurationDays] = useState(plan.durationDays);
  const [groupClassQuota, setGroupClassQuota] = useState(plan.groupClassQuota);
  const [ptSessionQuota, setPtSessionQuota] = useState(plan.ptSessionQuota);
  const [description, setDescription] = useState(plan.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      setName(plan.name);
      setPrice(plan.price);
      setDurationDays(plan.durationDays);
      setGroupClassQuota(plan.groupClassQuota);
      setPtSessionQuota(plan.ptSessionQuota);
      setDescription(plan.description || "");
    }
  }, [plan, open]);

  // Trigger Validation
  const triggerResult = validateCurriculumRequirements(plan.discipline, groupClassQuota);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (triggerResult.isBlocked) return;
    if (price <= 0 || durationDays <= 0) {
      alert("Giá bán và số ngày hạn dùng phải lớn hơn 0!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        id: plan.id,
        name: name.trim(),
        price,
        durationDays,
        groupClassQuota: plan.discipline === "GYM" ? 0 : groupClassQuota,
        ptSessionQuota,
        description: description.trim(),
      });
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Edit2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Sửa Gói Cước (PUT)
                </h3>
                <span className="font-mono text-xs font-bold text-[#008b74] bg-[#e6f7f2] px-2 py-0.5 rounded">
                  {plan.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Điều chỉnh giá bán hoặc định mức quota số buổi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Plan Fixed Info Overview */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Bộ môn & Hạng vé:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-slate-900">{plan.disciplineName}</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">{plan.tierLabel}</span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            {plan.code}
          </span>
        </div>

        {/* Trigger Violation Alert */}
        {triggerResult.isBlocked && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 animate-in fade-in-50">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">
                Kích hoạt DB Trigger Chặn: {triggerResult.triggerName}
              </p>
              <p className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                {triggerResult.message}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700">Tên thương mại gói cước</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700">Giá gói cước (VNĐ)</label>
              <input
                type="number"
                step={50000}
                min={50000}
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-700">Thời hạn sử dụng (Số ngày)</label>
              <input
                type="number"
                min={1}
                required
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>
          </div>

          {/* Quota adjustments */}
          <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              Điều chỉnh định mức quyền lợi (Quota)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Số buổi Lớp Nhóm
                  </label>
                  {plan.discipline === "GYM" && (
                    <span className="text-[10px] text-rose-600 font-bold">Gym = 0</span>
                  )}
                </div>
                <input
                  type="number"
                  min={0}
                  value={groupClassQuota}
                  onChange={(e) => setGroupClassQuota(Number(e.target.value))}
                  className={cn(
                    "mt-1 w-full rounded-xl border py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1",
                    plan.discipline === "GYM" && groupClassQuota > 0
                      ? "border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                      : "border-slate-200 bg-white focus:border-[#008b74] focus:ring-[#008b74]"
                  )}
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">
                  Số buổi Huấn Luyện Viên 1:1 (PT)
                </label>
                <input
                  type="number"
                  min={0}
                  value={ptSessionQuota}
                  onChange={(e) => setPtSessionQuota(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700">Mô tả quyền lợi gói</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              variant="mint"
              size="sm"
              disabled={isSubmitting || triggerResult.isBlocked}
              className="font-bold shadow-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Cập nhật gói cước (PUT)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
