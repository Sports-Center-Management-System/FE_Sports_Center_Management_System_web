import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  UserCheck,
  Dumbbell,
  ShieldCheck,
  X,
  Phone,
} from "lucide-react";
import { BookingSession } from "../types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface SessionDetailModalProps {
  session: BookingSession | null;
  open: boolean;
  onClose: () => void;
  onReschedule?: (session: BookingSession) => void;
  onCancel?: (session: BookingSession) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({
  session,
  open,
  onClose,
  onReschedule,
  onCancel,
}) => {
  if (!open || !session) return null;

  const isUpcoming = session.status === "UPCOMING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
      <div className="w-full max-w-lg rounded-2xl bg-white p-7 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {session.bookingCode}
              </span>
              <Badge variant="mint" className="text-[10px] font-bold">
                {session.statusLabel}
              </Badge>
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {session.sessionTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="mt-5 space-y-4 text-xs">
          {/* Coach Box */}
          <div className="rounded-2xl border border-slate-100 bg-[#f8fafc] p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              HUẤN LUYỆN VIÊN PHỤ TRÁCH
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={session.coach.avatarUrl}
                  alt={session.coach.name}
                  fallback={session.coach.name.substring(0, 2)}
                  size="md"
                  className="border-2 border-white shadow-sm"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {session.coach.name}
                  </h4>
                  <p className="text-slate-500">{session.coach.specialty}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full text-amber-700 font-bold border border-amber-200/60">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                <span>{session.coach.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          {/* Time & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-100 p-3.5 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Thời gian</span>
              <p className="mt-1 font-bold text-[#008b74] text-sm">{session.timeSlot}</p>
              <p className="text-slate-600 mt-0.5">{session.dateLabel}</p>
            </div>
            <div className="rounded-xl border border-slate-100 p-3.5 bg-white">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Địa điểm</span>
              <p className="mt-1 font-bold text-slate-800 text-sm">{session.location}</p>
              <p className="text-slate-500 mt-0.5">Trung tâm Dao mẻ WDP</p>
            </div>
          </div>

          {/* Training Goals & Package */}
          <div className="rounded-xl border border-slate-100 p-4 space-y-2 bg-white">
            <div className="flex justify-between">
              <span className="text-slate-500">Gói tập trừ buổi:</span>
              <span className="font-bold text-slate-900">{session.packageName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mục tiêu bài tập:</span>
              <span className="font-medium text-slate-800">{session.workoutGoal || "Tập luyện sức mạnh cá nhân"}</span>
            </div>
            {session.notes && (
              <div className="flex justify-between pt-1 border-t border-slate-50">
                <span className="text-slate-500">Ghi chú từ HLV:</span>
                <span className="font-medium text-[#008b74]">{session.notes}</span>
              </div>
            )}
          </div>

          {/* Cancellation Policy reminder */}
          <div className="flex items-start gap-2.5 rounded-xl bg-[#eff7fc] p-3 text-sky-800">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Bạn có thể đổi lịch hoặc huỷ lịch trước giờ tập ít nhất <span className="font-bold">2 tiếng</span> mà không bị trừ buổi tập trong gói.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} size="sm">
            Đóng
          </Button>
          {isUpcoming && onReschedule && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose();
                onReschedule(session);
              }}
              className="border-[#008b74] text-[#008b74] hover:bg-[#e6f7f2]"
            >
              Đổi lịch tập
            </Button>
          )}
          {isUpcoming && onCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onClose();
                onCancel(session);
              }}
            >
              Huỷ buổi tập
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
