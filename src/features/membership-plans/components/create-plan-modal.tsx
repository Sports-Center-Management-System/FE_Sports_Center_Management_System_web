import React, { useState } from "react";
import { CreatePlanPayload, DisciplineType, PlanTier } from "../types";
import { DISCIPLINES, PLAN_TIERS, validateCurriculumRequirements } from "../mock-data";
import { Button } from "@/components/ui/button";
import { X, Plus, AlertTriangle, ShieldCheck, Layers, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePlanPayload) => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [discipline, setDiscipline] = useState<DisciplineType>("GYM");
  const [tier, setTier] = useState<PlanTier>("PLUS");
  const [price, setPrice] = useState<number>(850000);
  const [durationDays, setDurationDays] = useState<number>(30);
  const [groupClassQuota, setGroupClassQuota] = useState<number>(0);
  const [ptSessionQuota, setPtSessionQuota] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Trigger Validation: Check Gym with group class
  const triggerResult = validateCurriculumRequirements(discipline, groupClassQuota);

  // Handle discipline selection
  const handleDisciplineChange = (d: DisciplineType) => {
    setDiscipline(d);
    // If Gym, automatically suggest 0 for group class
    if (d === "GYM") {
      setGroupClassQuota(0);
    } else if (groupClassQuota === 0) {
      setGroupClassQuota(12);
    }
  };

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
        code: code.trim().toUpperCase(),
        name: name.trim(),
        discipline,
        tier,
        price,
        durationDays,
        groupClassQuota: discipline === "GYM" ? 0 : groupClassQuota,
        ptSessionQuota,
        description: description.trim(),
      });
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-xl rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tạo Gói Tập Mới (POST)
              </h3>
              <p className="text-xs text-slate-500">
                Định nghĩa môn tập, hạng vé và kiểm tra trigger tự động chặn gói Gym lớp nhóm
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

        {/* Trigger Violation Alert (Real-time DB Trigger Simulation) */}
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
          {/* 1. Chọn 1 trong 4 Bộ Môn */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              1. Chọn Bộ môn thể thao (Discipline)
            </label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DISCIPLINES.map((d) => {
                const isSelected = discipline === d.code;
                return (
                  <button
                    key={d.code}
                    type="button"
                    onClick={() => handleDisciplineChange(d.code)}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all select-none",
                      isSelected
                        ? "border-[#008b74] bg-[#e6f7f2] text-[#008b74] font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="font-mono text-xs font-bold">{d.code}</span>
                    <span className="text-[10px] mt-0.5 font-medium leading-tight">
                      {d.name.split("&")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Hạng Vé (Tier) */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              2. Hạng vé (Membership Tier)
            </label>
            <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLAN_TIERS.map((t) => {
                const isSelected = tier === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    onClick={() => setTier(t.code)}
                    className={cn(
                      "rounded-xl border py-2 px-2 text-center text-xs font-semibold transition-all select-none",
                      isSelected
                        ? "border-[#008b74] bg-[#008b74] text-white shadow-xs"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Mã gói & Tên thương mại */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700">Mã gói cước (Code)</label>
              <input
                type="text"
                required
                placeholder="VD: GYM-PLUS-30"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold uppercase text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-slate-700">Tên thương mại gói cước</label>
              <input
                type="text"
                required
                placeholder="VD: Gym Plus Tháng (Tháng Năng Động)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>
          </div>

          {/* 4. Giá bán & Số ngày hạn dùng */}
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

          {/* 5. Định mức Quota Lớp Nhóm & Buổi PT (Trigger hotspot) */}
          <div className="rounded-xl border border-slate-200 bg-[#f8fafc] p-3 space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              5. Cấu hình định mức quyền lợi (Quota)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Số buổi Lớp Nhóm (Group Class)
                  </label>
                  {discipline === "GYM" && (
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
                    discipline === "GYM" && groupClassQuota > 0
                      ? "border-rose-300 bg-rose-50/50 text-rose-900 focus:ring-rose-500"
                      : "border-slate-200 bg-white focus:border-[#008b74] focus:ring-[#008b74]"
                  )}
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  {discipline === "GYM"
                    ? "* Môn Gym tuyệt đối không áp dụng lớp nhóm (DB Trigger chặn)"
                    : "Số lượt check-in lớp nhóm trong kỳ"}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700">
                  Số buổi Huấn Luyện Viên 1:1 (PT Quota)
                </label>
                <input
                  type="number"
                  min={0}
                  value={ptSessionQuota}
                  onChange={(e) => setPtSessionQuota(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Số buổi tập riêng kèm HLV cá nhân
                </p>
              </div>
            </div>
          </div>

          {/* 6. Mô tả */}
          <div>
            <label className="text-[11px] font-bold text-slate-700">Mô tả quyền lợi gói</label>
            <input
              type="text"
              placeholder="VD: Không giới hạn vào cửa, tặng 1 khăn tập, miễn phí xông hơi..."
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
              {isSubmitting ? "Đang lưu..." : "Tạo gói cước mới (POST)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
