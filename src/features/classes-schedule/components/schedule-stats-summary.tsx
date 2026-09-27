import React from "react";
import {
  CalendarDays,
  DoorOpen,
  Users,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import { ClassSchedule, TrainingRoom, CoachUser } from "../types";

interface ScheduleStatsSummaryProps {
  schedules: ClassSchedule[];
  rooms: TrainingRoom[];
  coaches: CoachUser[];
}

export const ScheduleStatsSummary: React.FC<ScheduleStatsSummaryProps> = ({
  schedules,
  rooms,
  coaches,
}) => {
  const activeSchedules = schedules.filter((s) => s.status !== "CANCELLED");
  const totalSessions = activeSchedules.length;

  const totalCapacity = activeSchedules.reduce((acc, s) => acc + s.capacity, 0);
  const totalEnrolled = activeSchedules.reduce((acc, s) => acc + s.enrolledCount, 0);
  const occupancyRate =
    totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  const activeRooms = rooms.filter((r) => r.status === "AVAILABLE").length;
  const activeCoaches = coaches.length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Sessions */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e6f7f2] text-[#008b74]">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tổng Lớp Trong Tuần
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {totalSessions}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              Buổi theo lịch
            </span>
          </div>
        </div>
      </div>

      {/* Occupancy Rate */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Tỷ Lệ Lấp Đầy Chỗ
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {occupancyRate}%
            </span>
            <span className="text-xs font-medium text-slate-500">
              ({totalEnrolled}/{totalCapacity} chỗ)
            </span>
          </div>
        </div>
      </div>

      {/* Active Studios */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <DoorOpen className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Phòng Tập / Studio Sẵn Sàng
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {activeRooms}/{rooms.length}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              100% Hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* Teaching Coaches */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all hover:shadow-md">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            HLV Lớp Nhóm Đang Dạy
          </p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              {activeCoaches}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Yoga, Boxing, Dance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
