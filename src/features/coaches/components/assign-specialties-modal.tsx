import React, { useState, useEffect } from "react";
import { CoachProfile, Specialty, AssignSpecialtiesPayload } from "../types";
import { Button } from "@/components/ui/button";
import { X, Check, Award, Star, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssignSpecialtiesModalProps {
  coach: CoachProfile | null;
  open: boolean;
  onClose: () => void;
  allSpecialties: Specialty[];
  onSubmit: (payload: AssignSpecialtiesPayload) => void;
}

export const AssignSpecialtiesModal: React.FC<AssignSpecialtiesModalProps> = ({
  coach,
  open,
  onClose,
  allSpecialties,
  onSubmit,
}) => {
  if (!open || !coach) return null;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (coach) {
      const currentIds = coach.specialties.map((s) => s.specialtyId);
      setSelectedIds(currentIds);
      const primary = coach.specialties.find((s) => s.isPrimary);
      setPrimaryId(primary ? primary.specialtyId : currentIds[0] || "");
    }
  }, [coach, open]);

  const toggleSpecialty = (spcId: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(spcId);
      if (isSelected) {
        const next = prev.filter((id) => id !== spcId);
        if (primaryId === spcId) {
          setPrimaryId(next[0] || "");
        }
        return next;
      } else {
        const next = [...prev, spcId];
        if (!primaryId) {
          setPrimaryId(spcId);
        }
        return next;
      }
    });
  };

  const handleSetPrimary = (e: React.MouseEvent, spcId: string) => {
    e.stopPropagation();
    if (!selectedIds.includes(spcId)) {
      setSelectedIds((prev) => [...prev, spcId]);
    }
    setPrimaryId(spcId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một chuyên môn cho Huấn luyện viên!");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        coachId: coach.id,
        selectedSpecialtyIds: selectedIds,
        primarySpecialtyId: primaryId || selectedIds[0],
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
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Gán Chuyên Môn Cho HLV
                </h3>
                <span className="font-mono text-xs font-bold text-[#008b74] bg-[#e6f7f2] px-2 py-0.5 rounded whitespace-nowrap shrink-0">
                  {coach.coachCode}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cấp quyền giảng dạy các bộ môn và chỉ định môn mũi nhọn
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

        {/* Coach Overview Card */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3 text-xs flex items-center justify-between">
          <div>
            <p className="font-bold text-slate-900 text-sm">{coach.fullName}</p>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Thâm niên: <span className="font-bold text-slate-700">{coach.experienceYears} năm</span> •{" "}
              {coach.certificates.join(", ")}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-[#008b74] bg-white border border-emerald-100 px-2 py-0.5 rounded-lg shadow-xs">
            {selectedIds.length} môn đã chọn
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-tight block">
            Chọn danh mục bộ môn được phép dạy (Multi-select)
          </label>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {allSpecialties.map((spc) => {
              const isChecked = selectedIds.includes(spc.id);
              const isPrimary = primaryId === spc.id;

              return (
                <div
                  key={spc.id}
                  onClick={() => toggleSpecialty(spc.id)}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none",
                    isChecked
                      ? "border-[#008b74] bg-[#e6f7f2]/30 shadow-xs"
                      : "border-slate-200/80 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                        isChecked
                          ? "border-[#008b74] bg-[#008b74] text-white"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{spc.name}</span>
                        <span className="font-mono text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 rounded">
                          {spc.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {spc.description}
                      </p>
                    </div>
                  </div>

                  {/* Primary Specialty Badge / Button */}
                  {isChecked && (
                    <button
                      type="button"
                      onClick={(e) => handleSetPrimary(e, spc.id)}
                      className={cn(
                        "ml-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold transition-all shrink-0",
                        isPrimary
                          ? "bg-amber-100 text-amber-800 border border-amber-300 shadow-xs"
                          : "bg-white text-slate-400 hover:text-amber-600 border border-slate-200"
                      )}
                      title="Đặt làm chuyên môn mũi nhọn của HLV"
                    >
                      <Star className={cn("h-3 w-3", isPrimary ? "fill-amber-500 text-amber-500" : "")} />
                      {isPrimary ? "Môn chính" : "Đặt môn chính"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-500 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#008b74] shrink-0" />
            <span>HLV chỉ có thể nhận học viên và đặt lịch dạy đối với các bộ môn đã được cấp quyền.</span>
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
              disabled={isSubmitting || selectedIds.length === 0}
              className="font-bold shadow-xs"
            >
              {isSubmitting ? "Đang lưu..." : "Lưu phân quyền (POST)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
