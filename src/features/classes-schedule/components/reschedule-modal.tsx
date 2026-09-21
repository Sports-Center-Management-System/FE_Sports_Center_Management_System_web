import React, { useState } from "react";
import { X, Calendar, Clock, RotateCw } from "lucide-react";
import { BookingSession } from "../types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RescheduleModalProps {
  session: BookingSession | null;
  open: boolean;
  onClose: () => void;
  onConfirmReschedule: (sessionId: string, newDate: string, newTime: string) => void;
}

const AVAILABLE_DATES = [
  { label: "Thứ 6, 25/09", value: "2026-09-25", text: "Thứ 6, 25/09/2026" },
  { label: "Thứ 7, 26/09", value: "2026-09-26", text: "Thứ 7, 26/09/2026" },
  { label: "Chủ Nhật, 27/09", value: "2026-09-27", text: "Chủ Nhật, 27/09/2026" },
  { label: "Thứ 2, 28/09", value: "2026-09-28", text: "Thứ 2, 28/09/2026" },
];

const AVAILABLE_SLOTS = [
  "08:30 - 10:00",
  "14:00 - 15:30",
  "16:00 - 17:30",
  "18:00 - 19:30",
  "20:00 - 21:30",
];

export const RescheduleModal: React.FC<RescheduleModalProps> = ({
  session,
  open,
  onClose,
  onConfirmReschedule,
}) => {
  if (!open || !session) return null;

  const [selectedDate, setSelectedDate] = useState(AVAILABLE_DATES[0]);
  const [selectedSlot, setSelectedSlot] = useState(AVAILABLE_SLOTS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmReschedule(session.id, selectedDate.text, selectedSlot);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#008b74]">
              <RotateCw className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Đổi lịch tập buổi hẹn
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Current Info */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">{session.sessionTitle}</p>
          <p className="mt-1">
            HLV: <span className="font-medium text-slate-900">{session.coach.name}</span>
          </p>
          <p className="mt-0.5 text-slate-400">
            Lịch hiện tại: {session.timeSlot} ({session.dateLabel})
          </p>
        </div>

        {/* Pick new Date */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Chọn ngày mới
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {AVAILABLE_DATES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDate(d)}
                className={cn(
                  "rounded-xl border py-2.5 px-3 text-xs font-semibold text-center transition-all",
                  selectedDate.value === d.value
                    ? "border-[#008b74] bg-[#e6f7f2] text-[#008b74] font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pick new Slot */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            2. Chọn khung giờ mới
          </label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_SLOTS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={cn(
                  "rounded-xl border py-2 px-2 text-xs font-semibold text-center transition-all",
                  selectedSlot === slot
                    ? "border-[#008b74] bg-[#e6f7f2] text-[#008b74] font-bold"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                )}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button
            variant="mint"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-bold"
          >
            {isSubmitting ? "Đang cập nhật..." : "Xác nhận đổi lịch"}
          </Button>
        </div>
      </div>
    </div>
  );
};
