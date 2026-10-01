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
  const summaryEntries = revenue
    ? [
        ["Doanh thu cơ bản", revenue.baseRevenue],
        ["Doanh thu PT", revenue.ptRevenue],
      ]
    : [];
  const fallbackMaxValue = Math.max(...summaryEntries.map(([, value]) => Number(value)), 0);

  return (
    <section className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-base font-semibold text-[#10221f]">
            <BarChart3 className="h-5 w-5 text-[#008b74]" />
            Phân tích doanh thu
          </div>
          <p className="mt-1 text-sm text-[#6a7d78]">
            {hasBreakdown
              ? "Doanh thu theo bộ môn."
              : "Biểu đồ theo bộ môn sẽ hiển thị khi API cung cấp dữ liệu."}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-11 animate-pulse rounded bg-[#edf7f3]" />
          ))}
        </div>
      ) : hasBreakdown ? (
        <div className="space-y-4">
          {disciplineEntries.map(([discipline, value]) => {
            const width = maxValue > 0 ? Math.max((value / maxValue) * 100, 3) : 0;

            return (
              <div key={discipline} className="grid gap-2 sm:grid-cols-[130px_1fr_150px] sm:items-center">
                <div className="text-sm font-semibold text-[#10221f]">{discipline}</div>
                <div className="h-8 overflow-hidden rounded-md bg-[#edf7f3]">
                  <div
                    className="h-full rounded-md bg-[#008b74]"
                    style={{ width: `${width}%` }}
                    aria-label={`${discipline}: ${formatVnd(value)}`}
                  />
                </div>
                <div className="text-sm font-semibold text-[#10221f] sm:text-right">
                  {formatVnd(value)}
                </div>
              </div>
            );
          })}
        </div>
      ) : revenue ? (
        <div className="space-y-4">
          {summaryEntries.map(([label, value]) => {
            const amount = Number(value);
            const width = fallbackMaxValue > 0 ? Math.max((amount / fallbackMaxValue) * 100, 3) : 0;

            return (
              <div key={label} className="grid gap-2 sm:grid-cols-[130px_1fr_150px] sm:items-center">
                <div className="text-sm font-semibold text-[#10221f]">{label}</div>
                <div className="h-8 overflow-hidden rounded-md bg-[#edf7f3]">
                  <div className="h-full rounded-md bg-[#6db9a5]" style={{ width: `${width}%` }} />
                </div>
                <div className="text-sm font-semibold text-[#10221f] sm:text-right">
                  {formatVnd(amount)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-[#cde4dc] bg-[#f8fffc] p-6 text-sm text-[#6a7d78]">
          Chưa có dữ liệu doanh thu.
        </div>
      )}
    </section>
  );
};
