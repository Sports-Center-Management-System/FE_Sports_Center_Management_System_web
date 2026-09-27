import React, { useState, useEffect } from "react";
import { CoachProfile, ConfigureCoachRatePayload } from "../types";
import { Button } from "@/components/ui/button";
import { X, DollarSign, Calendar, Clock, History, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfigureRateModalProps {
  coach: CoachProfile | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: ConfigureCoachRatePayload) => void;
}

const PRESET_RATES = [350000, 450000, 500000, 600000, 750000, 900000];

export const ConfigureRateModal: React.FC<ConfigureRateModalProps> = ({
  coach,
  open,
  onClose,
  onSubmit,
}) => {
  if (!open || !coach) return null;

  const [ratePerSession, setRatePerSession] = useState<number>(
    coach.currentRate ? coach.currentRate.ratePerSession : 450000
  );
  const [effectiveStartDate, setEffectiveStartDate] = useState<string>("2026-10-01");
  const [effectiveEndDate, setEffectiveEndDate] = useState<string>("2026-12-31");
  const [isOpenEnded, setIsOpenEnded] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coach && coach.currentRate) {
      setRatePerSession(coach.currentRate.ratePerSession);
      setEffectiveStartDate(coach.currentRate.effectiveStartDate);
      if (coach.currentRate.effectiveEndDate) {
        setEffectiveEndDate(coach.currentRate.effectiveEndDate);
        setIsOpenEnded(false);
      } else {
        setIsOpenEnded(true);
      }
      setNotes(coach.currentRate.notes || "");
    }
  }, [coach, open]);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const computedRangeLabel = `[${effectiveStartDate}, ${isOpenEnded ? "vô thời hạn" : effectiveEndDate || "..."}]`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ratePerSession <= 0) {
      alert("Mức phí theo buổi phải lớn hơn 0!");
      return;
    }

    if (!isOpenEnded && effectiveEndDate && effectiveStartDate > effectiveEndDate) {
      alert("Ngày bắt đầu hiệu lực phải nhỏ hơn hoặc bằng ngày kết thúc!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        coachId: coach.id,
        ratePerSession,
        effectiveStartDate,
        effectiveEndDate: isOpenEnded ? null : effectiveEndDate,
        notes,
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Cấu Hình Biểu Phí HLV
                </h3>
                <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 whitespace-nowrap shrink-0">
                  {coach.coachCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Thiết lập rate_per_session và dải ngày hiệu lực rate_range
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

        {/* Coach Overview */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3 text-xs flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900">{coach.fullName}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Chuyên môn: {coach.specialties.map((s) => s.specialtyName).join(", ") || "Chưa gán"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">Mức phí hiện tại</span>
            <span className="font-mono font-bold text-sm text-[#008b74]">
              {coach.currentRate ? formatVND(coach.currentRate.ratePerSession) : "Chưa thiết lập"}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* 1. Nhập mức phí theo buổi */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              1. Mức phí mỗi buổi (rate_per_session)
            </label>
            <div className="mt-1.5 relative">
              <input
                type="number"
                step={10000}
                min={50000}
                required
                value={ratePerSession}
                onChange={(e) => setRatePerSession(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-4 pr-16 text-base font-bold font-mono text-slate-900 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                VNĐ/buổi
              </span>
            </div>

            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">Mức gợi ý:</span>
              {PRESET_RATES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setRatePerSession(p)}
                  className={cn(
                    "rounded-lg border px-2 py-0.5 text-[11px] font-mono font-semibold transition-all",
                    ratePerSession === p
                      ? "border-[#008b74] bg-[#e6f7f2] text-[#008b74] font-bold"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {p / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* 2. Dải ngày hiệu lực (rate_range) */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
                2. Dải ngày hiệu lực (rate_range)
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isOpenEnded}
                  onChange={(e) => setIsOpenEnded(e.target.checked)}
                  className="rounded text-[#008b74] focus:ring-[#008b74]"
                />
                <span>Áp dụng vô thời hạn</span>
              </label>
            </div>

            <div className="mt-1.5 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Từ ngày (Start Date)</span>
                <input
                  type="date"
                  required
                  value={effectiveStartDate}
                  onChange={(e) => setEffectiveStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 font-medium">Đến ngày (End Date)</span>
                <input
                  type="date"
                  disabled={isOpenEnded}
                  value={effectiveEndDate}
                  onChange={(e) => setEffectiveEndDate(e.target.value)}
                  className={cn(
                    "mt-1 w-full rounded-xl border py-1.5 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]",
                    isOpenEnded
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "border-slate-200 bg-white"
                  )}
                />
              </div>
            </div>

            {/* Daterange PostgreSQL display banner */}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-100/80 px-3 py-1.5 text-[11px]">
              <span className="text-slate-500">PostgreSQL Daterange:</span>
              <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                {computedRangeLabel}
              </span>
            </div>
          </div>

          {/* 3. Ghi chú áp dụng */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
              3. Ghi chú điều chỉnh biểu phí (Tùy chọn)
            </label>
            <input
              type="text"
              placeholder="Vd: Điều chỉnh phí theo thâm niên quý 4, phí lớp VIP..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* Lịch sử biểu phí */}
          {coach.rateHistory.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-tight flex items-center gap-1 mb-2">
                <History className="h-3.5 w-3.5 text-slate-400" /> Lịch sử biểu phí cũ ({coach.rateHistory.length})
              </span>
              <div className="space-y-1.5 max-h-28 overflow-y-auto">
                {coach.rateHistory.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-[11px] border border-slate-100"
                  >
                    <div>
                      <span className="font-bold text-slate-700">{formatVND(h.ratePerSession)}</span>
                      <span className="text-slate-400 ml-2 font-mono">{h.rateRange}</span>
                    </div>
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-bold text-slate-600">
                      {h.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
              disabled={isSubmitting}
              className="font-bold shadow-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Áp dụng biểu phí mới (POST)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
