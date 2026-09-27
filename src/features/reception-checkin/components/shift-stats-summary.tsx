import React from "react";
import { CalendarCheck, Users, Clock, ShieldCheck } from "lucide-react";

export interface ShiftStatsSummaryProps {
  totalShiftsInWeek: number;
  totalActiveStaff: number;
  todayShiftsCount: number;
  coverageRate?: number;
}

export const ShiftStatsSummary: React.FC<ShiftStatsSummaryProps> = ({
  totalShiftsInWeek = 14,
  totalActiveStaff = 5,
  todayShiftsCount = 2,
  coverageRate = 100,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1: Tổng ca trực tuần */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Tổng ca trực tuần này</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#008b74]">
            <CalendarCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalShiftsInWeek} <span className="text-xs font-medium text-slate-500">ca</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Chuẩn 6 ca / ngày (2h30p mỗi ca)
          </p>
        </div>
      </div>

      {/* Stat 2: Nhân sự tham gia trực */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Nhân sự quầy lễ tân</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {totalActiveStaff} <span className="text-xs font-medium text-slate-500">nhân sự</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-400">
            1 Trưởng ca, 3 Chính thức, 1 Thực tập
          </p>
        </div>
      </div>

      {/* Stat 3: Ca trực hôm nay */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Ca trực hôm nay</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {todayShiftsCount} <span className="text-xs font-medium text-slate-500">ca trực</span>
          </h3>
          <p className="mt-0.5 text-[11px] text-[#008b74] font-semibold">
            Đã đủ nhân lực tiếp đón hội viên
          </p>
        </div>
      </div>

      {/* Stat 4: GiST Exclude Constraint */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-tight">
          <span>Kiểm soát trùng ca</span>
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e6f7f2] text-[#008b74]">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <h3 className="text-sm font-bold tracking-tight text-[#008b74]">
            GiST Exclude Active
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            Tự động ngăn chặn nhân viên trùng giờ
          </p>
        </div>
      </div>
    </div>
  );
};
