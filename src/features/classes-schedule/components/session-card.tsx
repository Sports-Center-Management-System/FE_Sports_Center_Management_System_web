import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  RotateCw,
  XCircle,
  Eye,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { BookingSession } from "../types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SessionCardProps {
  session: BookingSession;
  onViewDetail: (session: BookingSession) => void;
  onReschedule: (session: BookingSession) => void;
  onCancel: (session: BookingSession) => void;
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onViewDetail,
  onReschedule,
  onCancel,
}) => {
  const isUpcoming = session.status === "UPCOMING";
  const isCompleted = session.status === "COMPLETED";
  const isCancelled = session.status === "CANCELLED";

  const isFreeToCancel = session.remainingHoursBeforeSession >= 2;

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md",
        isUpcoming
          ? "border-slate-200/80 hover:border-[#008b74]/40"
          : isCompleted
          ? "border-slate-100 bg-slate-50/40 opacity-90"
          : "border-slate-100 bg-slate-50/30 opacity-70"
      )}
    >
      {/* Top Header: Code + Badge */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-tight text-slate-400">
            {session.bookingCode}
          </span>
          {isUpcoming && (
            <Badge variant="mint" className="px-2.5 py-0.5 text-[11px] font-bold">
              {session.statusLabel}
            </Badge>
          )}
          {isCompleted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" /> {session.statusLabel}
            </span>
          )}
          {isCancelled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold text-rose-600">
              <AlertCircle className="h-3 w-3" /> {session.statusLabel}
            </span>
          )}
        </div>

        {/* Title & Goal */}
        <h4 className="mt-3 text-base font-bold tracking-tight text-slate-900 leading-snug">
          {session.sessionTitle}
        </h4>
     

        {/* Date & Time info */}
        <div className="mt-4 space-y-2 rounded-xl bg-[#f8fafc] p-3 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="h-3.5 w-3.5 text-[#008b74]" />
            <span>{session.dateLabel}</span>
          </div>
          <div className="flex items-center gap-2 font-bold text-[#008b74]">
            <Clock className="h-3.5 w-3.5" />
            <span>{session.timeSlot}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span>{session.location}</span>
          </div>
        </div>

        {/* Coach Row */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
          <div className="flex items-center gap-2.5">
            <Avatar
              src={session.coach.avatarUrl}
              alt={session.coach.name}
              fallback={session.coach.name.substring(0, 2)}
              size="sm"
              className="border border-slate-200"
            />
            <div>
              <p className="text-xs font-bold text-slate-800 leading-tight">
                {session.coach.name}
              </p>
              <p className="text-[10px] text-slate-500">
                {session.coach.specialty}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
            <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
            <span>{session.coach.rating.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="mt-5 pt-3 border-t border-slate-100/80">
        {isUpcoming ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(session)}
              className="flex-1 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Eye className="mr-1 h-3.5 w-3.5 text-slate-500" /> Chi tiết
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReschedule(session)}
              className="rounded-xl border-[#008b74]/30 text-xs font-semibold text-[#008b74] hover:bg-[#e6f7f2]"
            >
              <RotateCw className="mr-1 h-3.5 w-3.5" /> Đổi lịch
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCancel(session)}
              className="rounded-xl text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
            >
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : isCompleted ? (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-emerald-600">
              Đã trừ 1 buổi trong gói
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(session)}
              className="rounded-xl text-xs font-medium text-slate-600"
            >
              <Eye className="mr-1 h-3.5 w-3.5" /> Xem lại
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-500">
              {isFreeToCancel ? "Đã hoàn 1 buổi vào gói" : "Đã trừ theo chính sách"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(session)}
              className="rounded-xl text-xs font-medium text-slate-600"
            >
              <Eye className="mr-1 h-3.5 w-3.5" /> Chi tiết
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
