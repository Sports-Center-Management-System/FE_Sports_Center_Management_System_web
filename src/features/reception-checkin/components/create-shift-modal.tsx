import React, { useState, useEffect } from "react";
import {
  StaffUser,
  StaffShift,
  ShiftType,
  CreateShiftPayload,
} from "../types";
import { checkShiftConflict, STANDARD_2H30_SLOTS } from "../mock-data";
import { Button } from "@/components/ui/button";
import { X, Calendar, Clock, AlertTriangle, ShieldCheck, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CreateShiftModalProps {
  open: boolean;
  onClose: () => void;
  staffList: StaffUser[];
  shifts: StaffShift[];
  prefillDate?: string;
  prefillStartTime?: string;
  prefillEndTime?: string;
  prefillShiftType?: ShiftType;
  onSubmit: (payload: CreateShiftPayload) => void;
}

export const CreateShiftModal: React.FC<CreateShiftModalProps> = ({
  open,
  onClose,
  staffList,
  shifts,
  prefillDate,
  prefillStartTime,
  prefillEndTime,
  prefillShiftType = "SLOT_2H30",
  onSubmit,
}) => {
  const [userId, setUserId] = useState<string>(staffList[0]?.id || "");
  const [date, setDate] = useState<string>(prefillDate || "2026-09-24");
  const [shiftType, setShiftType] = useState<ShiftType>(prefillShiftType);
  const [startTime, setStartTime] = useState<string>(prefillStartTime || "06:00");
  const [endTime, setEndTime] = useState<string>(prefillEndTime || "08:30");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (prefillDate) setDate(prefillDate);
    if (prefillStartTime && prefillEndTime) {
      setStartTime(prefillStartTime);
      setEndTime(prefillEndTime);
      setShiftType("SLOT_2H30");
    } else if (prefillShiftType) {
      setShiftType(prefillShiftType);
    }
  }, [prefillDate, prefillStartTime, prefillEndTime, prefillShiftType, open]);

  // Handle Preset shift change
  const handleShiftTypeChange = (type: ShiftType) => {
    setShiftType(type);
    if (type === "MORNING") {
      setStartTime("06:00");
      setEndTime("14:00");
    } else if (type === "AFTERNOON") {
      setStartTime("14:00");
      setEndTime("22:00");
    }
  };

  // Realtime GiST Exclude Conflict Detection
  const conflictResult = checkShiftConflict(
    shifts,
    null,
    userId,
    date,
    startTime,
    endTime
  );

  const selectedStaff = staffList.find((s) => s.id === userId) || staffList[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (conflictResult.hasConflict) return;

    setIsSubmitting(true);
    setTimeout(() => {
      onSubmit({
        userId,
        date,
        startTime,
        endTime,
        shiftType,
        notes,
      });
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tạo Ca Trực Lễ Tân Mới
              </h3>
              <p className="text-xs text-slate-500">
                Phân công ca làm việc cho nhân sự tiếp đón
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* 1. Chọn Nhân Viên */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
              1. Chọn nhân viên Lễ tân
            </label>
            <div className="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {staffList.map((staff) => {
                const isSelected = staff.id === userId;
                return (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => setUserId(staff.id)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all select-none",
                      isSelected
                        ? "border-[#008b74] bg-[#e6f7f2] shadow-xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-12 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-bold transition-colors",
                        isSelected
                          ? "bg-[#008b74] text-white"
                          : "bg-slate-100 text-slate-700"
                      )}
                    >
                      {staff.employeeCode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-xs font-bold truncate",
                          isSelected ? "text-[#008b74]" : "text-slate-900"
                        )}
                      >
                        {staff.fullName}
                      </p>
                      <span className="text-[10px] text-slate-500">
                        {staff.roleLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Ngày Trực */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
              2. Ngày trực ca
            </label>
            <div className="relative mt-1.5">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
              />
            </div>
          </div>

          {/* 3. Khung Giờ Ca Trực */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
              3. Chọn ca chuẩn (2h30p) hoặc giờ tùy chỉnh
            </label>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {STANDARD_2H30_SLOTS.map((s) => {
                const isSelected = startTime === s.startTime && endTime === s.endTime;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setStartTime(s.startTime);
                      setEndTime(s.endTime);
                      setShiftType("SLOT_2H30");
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-xl border py-1.5 px-1 text-center transition-all select-none",
                      isSelected
                        ? "border-[#008b74] bg-[#e6f7f2] text-[#008b74] font-bold shadow-xs"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span className="text-[11px] font-bold">{s.name}</span>
                    <span className="text-[9px] font-mono leading-none mt-0.5">{s.startTime}</span>
                  </button>
                );
              })}
            </div>

            {/* Start - End Time inputs */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Giờ bắt đầu</span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setShiftType("CUSTOM");
                  }}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium">Giờ kết thúc</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    setEndTime(e.target.value);
                    setShiftType("CUSTOM");
                  }}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs font-mono font-bold text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
                />
              </div>
            </div>
          </div>

          {/* 4. Ghi chú */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
              4. Ghi chú bàn giao ca (Tùy chọn)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Nhiệm vụ đặc biệt, quản lý chìa khóa, kiểm kê doanh thu..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* GiST Exclude Conflict Warning Banner */}
          {conflictResult.hasConflict ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Xung đột trùng giờ (GiST Exclude Conflict)</p>
                <p className="mt-0.5 text-[11px] text-rose-700 leading-relaxed">
                  {conflictResult.message}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 p-2.5 text-xs text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-[11px]">
                Thời gian trực hợp lệ, không phát hiện trùng ca làm việc.
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
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
              disabled={isSubmitting || conflictResult.hasConflict}
              className="font-bold shadow-xs"
            >
              {isSubmitting ? "Đang lưu ca trực..." : "Tạo ca trực (POST)"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
