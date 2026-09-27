import React, { useState } from "react";
import { StaffShift } from "../types";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X, Trash2 } from "lucide-react";

export interface DeleteShiftDialogProps {
  shift: StaffShift | null;
  open: boolean;
  onClose: () => void;
  onConfirmDelete: (shiftId: string, reason: string) => void;
}

const CANCEL_REASONS = [
  "Nhân viên xin nghỉ phép đột xuất",
  "Điều chuyển sang cơ sở khác",
  "Tối ưu lại định biên nhân sự ca trực",
  "Trùng lịch công tác / đào tạo nội bộ",
  "Lý do khác",
];

export const DeleteShiftDialog: React.FC<DeleteShiftDialogProps> = ({
  shift,
  open,
  onClose,
  onConfirmDelete,
}) => {
  if (!open || !shift) return null;

  const [selectedReason, setSelectedReason] = useState<string>(CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = () => {
    setIsDeleting(true);
    const finalReason =
      selectedReason === "Lý do khác" && customReason.trim()
        ? customReason
        : selectedReason;

    setTimeout(() => {
      onConfirmDelete(shift.id, finalReason);
      setIsDeleting(false);
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-base font-bold text-slate-900">
              Hủy Ca Trực Lễ Tân (DELETE)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shift Summary Box */}
        <div className="mt-4 rounded-xl bg-slate-50 p-3.5 border border-slate-200/70 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-200/80 font-mono text-xs font-bold text-slate-800">
              {shift.user.employeeCode}
            </div>
            <div>
              <p className="font-bold text-slate-900">{shift.user.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {shift.shiftCode} - {shift.shiftTypeLabel} ({shift.startTime} - {shift.endTime})
              </p>
            </div>
          </div>
          <p className="mt-2 text-slate-600 border-t border-slate-200/60 pt-2 font-medium">
            Ngày trực: <span className="font-bold text-slate-900">{shift.dayLabel}</span>
          </p>
        </div>

        {/* Cancellation Reason Selector */}
        <div className="mt-4">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-tight">
            Lý do hủy phân ca
          </label>
          <select
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {selectedReason === "Lý do khác" && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập chi tiết lý do..."
              className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 px-3 text-xs text-slate-800 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          )}
        </div>

        {/* Warning Note */}
        <p className="mt-4 text-[11px] text-slate-400">
          Sau khi hủy, ca trực sẽ được gỡ khỏi lịch tuần và thông báo tự động đến nhân viên phụ trách.
        </p>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Giữ lại ca
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="font-bold shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {isDeleting ? "Đang xóa ca..." : "Xác nhận hủy ca (DELETE)"}
          </Button>
        </div>
      </div>
    </div>
  );
};
