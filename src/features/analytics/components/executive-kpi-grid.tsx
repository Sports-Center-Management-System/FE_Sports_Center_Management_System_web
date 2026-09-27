import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Layers,
  CreditCard,
  Target,
} from "lucide-react";
import { RevenueMetric, NewMemberGrowth, RealtimeOccupancyData } from "../types/manager-dashboard.types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export interface ExecutiveKPIGridProps {
  todayRevenue: RevenueMetric;
  monthlyRevenue: RevenueMetric;
  memberGrowth: NewMemberGrowth;
  occupancy: RealtimeOccupancyData;
}

const formatVND = (val: number) => {
  return new Intl.NumberFormat("vi-VN").format(val) + "đ";
};

export const ExecutiveKPIGrid: React.FC<ExecutiveKPIGridProps> = ({
  todayRevenue,
  monthlyRevenue,
  memberGrowth,
  occupancy,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* KPI 1: Doanh thu hôm nay (Tách Base & PT) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#008b74]/40">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">
              Doanh thu hôm nay
            </span>
            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3 stroke-[2.2]" />
              <span>+{todayRevenue.growthPercent}%</span>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatVND(todayRevenue.totalAmount)}
            </h3>
           
          </div>
        </div>

        {/* Phân tách Base vs PT */}
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#008b74]" />
              <span className="text-slate-600 font-medium">Gói cơ bản (Base):</span>
            </div>
            <span className="font-bold text-slate-800 font-mono">
              {formatVND(todayRevenue.baseAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-slate-600 font-medium">Dịch vụ PT (1-1):</span>
            </div>
            <span className="font-bold text-slate-800 font-mono">
              {formatVND(todayRevenue.ptAmount)}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="bg-[#008b74] h-full"
              style={{
                width: `${(todayRevenue.baseAmount / todayRevenue.totalAmount) * 100}%`,
              }}
            />
            <div
              className="bg-sky-500 h-full"
              style={{
                width: `${(todayRevenue.ptAmount / todayRevenue.totalAmount) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI 2: Doanh thu tháng này (Tách Base & PT) */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#008b74]/40">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">
              Doanh thu tháng này
            </span>
            <div className="flex items-center gap-1 rounded-full bg-[#e6f7f2] px-2.5 py-0.5 text-[11px] font-bold text-[#008b74]">
              <Target className="h-3 w-3 stroke-[2]" />
              <span>{monthlyRevenue.achievementPercent}% KPI</span>
            </div>
          </div>

          <div className="mt-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {formatVND(monthlyRevenue.totalAmount)}
            </h3>
         
          </div>
        </div>

        {/* Phân tách Base vs PT */}
        <div className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#008b74]" />
              <span className="text-slate-600 font-medium">Gói cơ bản:</span>
            </div>
            <span className="font-bold text-slate-800 font-mono">
              {formatVND(monthlyRevenue.baseAmount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <span className="text-slate-600 font-medium">Dịch vụ PT:</span>
            </div>
            <span className="font-bold text-slate-800 font-mono">
              {formatVND(monthlyRevenue.ptAmount)}
            </span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden flex">
            <div
              className="bg-[#008b74] h-full"
              style={{
                width: `${(monthlyRevenue.baseAmount / monthlyRevenue.totalAmount) * 100}%`,
              }}
            />
            <div
              className="bg-sky-500 h-full"
              style={{
                width: `${(monthlyRevenue.ptAmount / monthlyRevenue.totalAmount) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* KPI 3: Sĩ số hội viên mới trong kỳ */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#008b74]/40">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">
              Hội viên mới đăng ký
            </span>
           
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              +{memberGrowth.monthCount}
            </h3>
            <span className="text-xs font-medium text-slate-500">hội viên kỳ này</span>
          </div>
        </div>

        {/* Cơ cấu đăng ký mới */}
        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
          <div className="flex items-center justify-between text-slate-600">
            <span>Thẻ Platinum 12 tháng:</span>
            <span className="font-bold text-slate-800">42%</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Gói Hội viên kèm PT:</span>
            <span className="font-bold text-slate-800">36%</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Gói ngắn hạn / Trải nghiệm:</span>
            <span className="font-bold text-slate-800">22%</span>
          </div>
        </div>
      </div>

      {/* KPI 4: Công suất lấp đầy thời gian thực */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-[#008b74]/40">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-tight text-slate-500 uppercase">
              Công suất phòng tập
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
              Giờ cao điểm
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
              {occupancy.overallRate}%
            </h3>
            <span className="text-xs font-medium text-slate-500">
              ({occupancy.totalCurrent} / {occupancy.totalCapacity} khách)
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Cập nhật tự động qua cổng Check-in
          </p>
        </div>

        {/* Thanh công suất & trạng thái */}
        <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-xs">
          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Mức tải an toàn (&lt;85%)</span>
            <span className="font-semibold text-slate-700">Còn trống {occupancy.totalCapacity - occupancy.totalCurrent} chỗ</span>
          </div>
          <Progress
            value={occupancy.overallRate}
            max={100}
            className="h-2 bg-slate-100"
            indicatorClassName={
              occupancy.overallRate > 85
                ? "bg-rose-500"
                : occupancy.overallRate > 70
                ? "bg-amber-500"
                : "bg-[#008b74]"
            }
          />
        </div>
      </div>
    </div>
  );
};
