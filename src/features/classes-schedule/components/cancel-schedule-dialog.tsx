import React, { useState } from "react";
import {
  AlertTriangle,
  X,
  Trash2,
  Users,
  ShieldX,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Info,
} from "lucide-react";
import { ClassSchedule } from "../types";

interface CancelScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduleId: string, reason: string) => void;
  schedule: ClassSchedule | null;
}

export const CancelScheduleDialog: React.FC<CancelScheduleDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  schedule,
}) => {
  const [reason, setReason] = useState<string>("HLV bận đột xuất / Sự cố phòng tập");

  if (!isOpen || !schedule) return null;

  const hasEnrolledStudents = schedule.enrolledCount > 0;

  const handleConfirm = () => {
    if (hasEnrolledStudents) return;
    onConfirm(schedule.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100">
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 text-white ${
            hasEnrolledStudents ? "bg-amber-600 border-amber-700" : "bg-rose-600 border-rose-700"
          }`}
        >
          <div className="flex items-center gap-2">
            {hasEnrolledStudents ? (
              <ShieldX className="h-5 w-5" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
            <h3 className="text-lg font-bold">
              {hasEnrolledStudents
                ? "Chặn Hủy: Đã Có Học Viên Đăng Ký"
                : "Xác Nhận Hủy Ca Lớp (DELETE)"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target class info */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-500">
                {schedule.scheduleCode}
              </span>
              <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold bg-white text-slate-700 border border-slate-200">
                {schedule.disciplineLabel}
              </span>
            </div>

            <div className="font-bold text-slate-900 text-base">
              {schedule.className}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{schedule.dayLabel}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{schedule.startTime} - {schedule.endTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <DoorOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{schedule.roomName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{schedule.coachName}</span>
              </div>
            </div>
          </div>

          {/* Condition 1: Blocked if enrolledCount > 0 */}
          {hasEnrolledStudents ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <p className="font-bold">
                    Quy tắc nghiệp vụ: Không thể xóa ca lớp này!
                  </p>
                  <p className="mt-1">
                    Lớp hiện đang có{" "}
                    <span className="font-bold underline text-amber-950">
                      {schedule.enrolledCount} học viên
                    </span>{" "}
                    đã giữ chỗ trong hệ thống.
                  </p>
                  <p className="mt-2 text-amber-800">
                    Để hủy lớp, bộ phận vận hành cần thực hiện:
                  </p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5 text-amber-800">
                    <li>Gửi thông báo & hoàn trả quota buổi học cho học viên.</li>
                    <li>Hoặc sử dụng chức năng <strong>"Đổi lịch"</strong> để dời sang ca khác.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Condition 2: Allowed if enrolledCount === 0 */
            <div className="space-y-3">
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <Users className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>
                  Lớp này hiện chưa có học viên nào ghi danh (0/{schedule.capacity} HV). Cho phép hủy an toàn khỏi hệ thống.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Lý do hủy ca lớp <span className="text-rose-500">*</span>
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="HLV bận đột xuất / Sự cố phòng tập">
                    HLV bận đột xuất / Sự cố phòng tập
                  </option>
                  <option value="Bảo trì cơ sở vật chất định kỳ">
                    Bảo trì cơ sở vật chất định kỳ
                  </option>
                  <option value="Tái cơ cấu khung giờ học viên thấp điểm">
                    Tái cơ cấu khung giờ học viên thấp điểm
                  </option>
                  <option value="Khác">Lý do khác</option>
                </select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {hasEnrolledStudents ? "Đã Hiểu & Đóng" : "Hủy Bỏ"}
            </button>
            {!hasEnrolledStudents && (
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-rose-700 transition-colors"
              >
                Xác Nhận Hủy Lớp (DELETE)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
