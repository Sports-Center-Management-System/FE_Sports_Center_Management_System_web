import React from "react";
import { Calendar, CheckCircle2, Dumbbell, ShieldAlert } from "lucide-react";

export interface ScheduleStatsProps {
  upcomingCount: number;
  completedCount: number;
  totalPackageSessions: number;
  remainingSessions: number;
  nextSessionText?: string;
}

export const ScheduleStats: React.FC<ScheduleStatsProps> = ({
  upcomingCount,
  completedCount,
  totalPackageSessions,
  remainingSessions,
  nextSessionText = "18:00 - Thứ 5, 24/09",
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Buổi tập kế tiếp */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Buổi tập kế tiếp</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
            <Calendar className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-base font-bold text-slate-900 leading-tight">
            {upcomingCount > 0 ? nextSessionText : "Chưa có lịch mới"}
          </p>
          <p className="mt-1 text-[11px] font-medium text-[#008b74]">
            {upcomingCount} buổi tập sắp tới
          </p>
        </div>
      </div>

      {/* Stat 2: Đã hoàn thành */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Đã hoàn thành</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold text-slate-900 leading-tight">
            {completedCount} <span className="text-xs font-medium text-slate-500">/ {totalPackageSessions} buổi</span>
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(completedCount / totalPackageSessions) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-slate-600">
              {Math.round((completedCount / totalPackageSessions) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Stat 3: Còn lại trong gói */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Buổi còn lại trong gói</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <Dumbbell className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xl font-bold text-slate-900 leading-tight">
            {remainingSessions} <span className="text-xs font-medium text-slate-500">buổi tập</span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Gói Elite Wellness PT
          </p>
        </div>
      </div>

      {/* Stat 4: Chính sách hủy lịch */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Chính sách linh hoạt</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-xs font-bold text-slate-800 leading-snug">
            Đổi / Huỷ trước 2 tiếng
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Miễn phí 100% không trừ buổi
          </p>
        </div>
      </div>
    </div>
  );
};
