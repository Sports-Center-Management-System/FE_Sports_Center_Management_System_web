import React from "react";
import { BarChart3 } from "lucide-react";
import { RevenueReport } from "@/features/analytics/types/analytics.types";
import { formatVnd } from "@/features/analytics/components/revenue-summary";

interface RevenueChartProps {
  revenue: RevenueReport | null;
  isLoading: boolean;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ revenue, isLoading }) => {
  const disciplineEntries = Object.entries(revenue?.byDiscipline ?? {});
  const hasBreakdown = disciplineEntries.length > 0;
  const maxValue = Math.max(...disciplineEntries.map(([, value]) => value), 0);
  const summaryEntries = [
    { label: "Doanh thu cơ bản", value: revenue?.baseRevenue ?? null, color: "bg-[#2563eb]" },
    { label: "Doanh thu PT", value: revenue?.ptRevenue ?? null, color: "bg-[#e78342]" },
  ];
  const summaryMaxValue = Math.max(...summaryEntries.map(({ value }) => value ?? 0), 0);

  return (
    <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
            <BarChart3 className="h-5 w-5 text-[#008b74]" />
            Snapshot doanh thu
          </div>
          <p className="mt-1 text-sm text-[#6a7d78]">
            So sánh doanh thu cơ bản và doanh thu PT.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((item) => (
            <div key={item} className="h-11 animate-pulse rounded bg-[#edf7f3]" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="space-y-4">
            {summaryEntries.map(({ label, value, color }) => {
              const width = value !== null && value > 0 && summaryMaxValue > 0
                ? Math.max((value / summaryMaxValue) * 100, 3)
                : 0;

              return (
                <div key={label} className="grid gap-2 sm:grid-cols-[150px_1fr_150px] sm:items-center">
                  <div className="text-sm font-semibold text-[#10221f]">{label}</div>
                  <div className="h-8 overflow-hidden rounded-md bg-[#edf7f3]">
                    <div className={`h-full rounded-md ${color}`} style={{ width: `${width}%` }} />
                  </div>
                  <div className="text-sm font-semibold text-[#10221f] sm:text-right">
                    {value === null ? "—" : formatVnd(value)}
                  </div>
                </div>
              );
            })}
          </div>
          {hasBreakdown && (
            <div className="space-y-4 border-t border-[#e4f0ec] pt-5">
              <h3 className="text-sm font-semibold text-[#10221f]">Doanh thu theo bộ môn</h3>
              {disciplineEntries.map(([discipline, value]) => {
                const width = value > 0 && maxValue > 0 ? Math.max((value / maxValue) * 100, 3) : 0;

                return (
                  <div key={discipline} className="grid gap-2 sm:grid-cols-[150px_1fr_150px] sm:items-center">
                    <div className="text-sm font-semibold text-[#10221f]">{discipline}</div>
                    <div className="h-8 overflow-hidden rounded-md bg-[#edf7f3]">
                      <div className="h-full rounded-md bg-[#008b74]" style={{ width: `${width}%` }} />
                    </div>
                    <div className="text-sm font-semibold text-[#10221f] sm:text-right">
                      {formatVnd(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!revenue && <p className="text-sm text-[#6a7d78]">Chưa có dữ liệu doanh thu.</p>}
        </div>
      )}
    </section>
  );
};
