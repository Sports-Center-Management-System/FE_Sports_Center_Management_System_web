import React, { useState } from "react";
import { AlertTriangle, X, CheckCircle2, AlertCircle } from "lucide-react";
import { BookingSession } from "../types";
import { Button } from "@/components/ui/button";

export interface CancelBookingModalProps {
  session: BookingSession | null;
  open: boolean;
  onClose: () => void;
  onConfirmCancel: (sessionId: string, reason: string) => void;
}

const CANCEL_REASONS = [
  "Bận việc đột xuất không thể sắp xếp",
  "Sức khỏe không đảm bảo (ốm/mệt)",
  "Muốn đổi sang huấn luyện viên khác",
  "Trùng lịch công tác / học tập",
  "Lý do khác",
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  session,
  open,
  onClose,
  onConfirmCancel,
}) => {
  if (!open || !session) return null;

  const [selectedReason, setSelectedReason] = useState(CANCEL_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFreeCancellation = session.remainingHoursBeforeSession >= 2;

  const handleSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmCancel(session.id, selectedReason);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">
              Huỷ buổi tập hẹn trước
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Policy status notification box */}
        <div className="mt-4">
          {isFreeCancellation ? (
            <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 p-3 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-bold">Đủ điều kiện hoàn trả buổi tập</p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Bạn huỷ trước giờ tập &gt; 2 tiếng. 1 buổi tập sẽ được cộng trả lại ngay vào gói {session.packageName}.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-bold">Lưu ý chính sách hủy muộn (&lt; 2 tiếng)</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Buổi tập này còn ít hơn 2 tiếng trước giờ bắt đầu. Theo quy định, 1 buổi tập vẫn sẽ bị trừ vào gói của bạn.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Session brief */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-bold text-slate-800">{session.sessionTitle}</p>
          <p className="mt-0.5">HLV: {session.coach.name}</p>
          <p className="text-slate-400">Thời gian: {session.timeSlot} ({session.dateLabel})</p>
        </div>

        {/* Reason Selector */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lý do hủy buổi tập
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2.5 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:outline-none focus:ring-2 focus:ring-[#008b74]/15"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Giữ lại lịch tập
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="font-bold"
          >
            {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy lịch"}
          </Button>
        </div>
      </div>
    </div>
  );
};
