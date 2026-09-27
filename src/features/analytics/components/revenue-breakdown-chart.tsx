import React, { useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { RevenueBreakdownPoint } from "../types/manager-dashboard.types";
import { cn } from "@/lib/utils";

export interface RevenueBreakdownChartProps {
  data?: RevenueBreakdownPoint[];
}

const DEFAULT_REVENUE_DATA: RevenueBreakdownPoint[] = [
  { date: "14/09", dayLabel: "T2", baseAmount: 22.5, ptAmount: 14.0, total: 36.5 },
  { date: "15/09", dayLabel: "T3", baseAmount: 26.0, ptAmount: 16.5, total: 42.5 },
  { date: "16/09", dayLabel: "T4", baseAmount: 24.0, ptAmount: 18.0, total: 42.0 },
  { date: "17/09", dayLabel: "T5", baseAmount: 28.5, ptAmount: 21.0, total: 49.5 },
  { date: "18/09", dayLabel: "T6", baseAmount: 31.0, ptAmount: 24.5, total: 55.5 },
  { date: "19/09", dayLabel: "T7", baseAmount: 36.0, ptAmount: 28.0, total: 64.0 },
  { date: "20/09", dayLabel: "CN", baseAmount: 38.5, ptAmount: 26.5, total: 65.0 },
  { date: "21/09", dayLabel: "T2", baseAmount: 23.0, ptAmount: 15.0, total: 38.0 },
  { date: "22/09", dayLabel: "T3", baseAmount: 25.5, ptAmount: 17.5, total: 43.0 },
  { date: "23/09", dayLabel: "T4", baseAmount: 27.0, ptAmount: 19.0, total: 46.0 },
  { date: "24/09", dayLabel: "T5", baseAmount: 29.0, ptAmount: 22.5, total: 51.5 },
  { date: "25/09", dayLabel: "T6", baseAmount: 32.5, ptAmount: 25.0, total: 57.5 },
  { date: "26/09", dayLabel: "T7", baseAmount: 39.0, ptAmount: 29.5, total: 68.5 },
  { date: "27/09", dayLabel: "CN", baseAmount: 24.5, ptAmount: 18.0, total: 42.5 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const base = payload.find((p: any) => p.dataKey === "baseAmount")?.value || 0;
    const pt = payload.find((p: any) => p.dataKey === "ptAmount")?.value || 0;
    const total = base + pt;

    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xl text-xs">
        <p className="font-bold text-slate-800 mb-2 border-b border-slate-100 pb-1">
          Ngày {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#008b74]" /> Gói cơ bản:
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {base.toFixed(1)} tr ({((base / total) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2 w-2 rounded-full bg-[#0284c7]" /> Doanh thu PT:
            </span>
            <span className="font-bold text-slate-900 font-mono">
              {pt.toFixed(1)} tr ({((pt / total) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-1.5 font-bold text-slate-900">
            <span>Tổng cộng:</span>
            <span className="text-[#008b74] font-mono">{total.toFixed(1)} triệu VNĐ</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const RevenueBreakdownChart: React.FC<RevenueBreakdownChartProps> = ({
  data = DEFAULT_REVENUE_DATA,
}) => {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  const totalPeriodRevenue = data.reduce((acc, cur) => acc + cur.total, 0);
  const totalBase = data.reduce((acc, cur) => acc + cur.baseAmount, 0);
  const totalPT = data.reduce((acc, cur) => acc + cur.ptAmount, 0);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold tracking-tight text-slate-900">
            Cơ cấu Doanh thu: Gói Cơ Bản vs Dịch vụ PT
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Theo dõi xu hướng phân bổ thực thu 14 ngày gần nhất
          </p>
        </div>

        {/* Legend Summary Indicators */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#008b74]" />
            <span className="font-medium text-slate-600">
              Gói cơ bản ({((totalBase / totalPeriodRevenue) * 100).toFixed(0)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#0284c7]" />
            <span className="font-medium text-slate-600">
              Dịch vụ PT ({((totalPT / totalPeriodRevenue) * 100).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(val) => `${val}tr`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="baseAmount"
              name="Gói cơ bản"
              stackId="revenue"
              fill="#008b74"
              radius={[0, 0, 0, 0]}
              maxBarSize={32}
            />
            <Bar
              dataKey="ptAmount"
              name="Dịch vụ PT"
              stackId="revenue"
              fill="#0284c7"
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line
              type="monotone"
              dataKey="total"
              name="Tổng doanh thu"
              stroke="#0f172a"
              strokeWidth={2}
              dot={{ r: 3, fill: "#0f172a" }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Summary Bar */}
      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#f8fafc] p-3 text-center text-xs">
        <div>
          <span className="text-slate-500">Tổng doanh thu kỳ:</span>
          <p className="mt-0.5 font-bold text-slate-900 font-mono">
            {totalPeriodRevenue.toFixed(1)} triệu VNĐ
          </p>
        </div>
        <div>
          <span className="text-slate-500">Gói cơ bản tích lũy:</span>
          <p className="mt-0.5 font-bold text-[#008b74] font-mono">
            {totalBase.toFixed(1)} triệu VNĐ
          </p>
        </div>
        <div>
          <span className="text-slate-500">Dịch vụ PT tích lũy:</span>
          <p className="mt-0.5 font-bold text-[#0284c7] font-mono">
            {totalPT.toFixed(1)} triệu VNĐ
          </p>
        </div>
      </div>
    </div>
  );
};
