import React from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DisciplineFilter, ReportFilters } from "@/features/analytics/types/analytics.types";

const disciplines: Array<{ label: string; value: DisciplineFilter }> = [
  { label: "Tất cả bộ môn", value: "ALL" },
  { label: "Boxing", value: "BOXING" },
  { label: "Yoga", value: "YOGA" },
  { label: "Gym", value: "GYM" },
  { label: "Dancing", value: "DANCING" },
];

const membershipTiers = [{ label: "Tất cả hạng vé", value: "ALL" }];

interface ReportFiltersProps {
  filters: ReportFilters;
  onChange: (filters: ReportFilters) => void;
  onApply: () => void;
}

export const ReportFiltersBar: React.FC<ReportFiltersProps> = ({
  filters,
  onChange,
  onApply,
}) => {
  const updateFilter = <Key extends keyof ReportFilters>(key: Key, value: ReportFilters[Key]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section className="rounded-lg border border-[#dceee8] bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#10221f]">
            <Filter className="h-4 w-4 text-[#008b74]" />
            Bộ lọc báo cáo
          </div>
          <p className="mt-1 text-xs text-[#6a7d78]">
            Bộ lọc chưa khả dụng vì API báo cáo chưa hỗ trợ tham số lọc.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <label className="space-y-1.5 text-xs font-medium text-[#5d716b]">
          Từ ngày
          <input
            type="date"
            disabled
            value={filters.fromDate}
            onChange={(event) => updateFilter("fromDate", event.target.value)}
            className="h-10 w-full rounded-md border border-[#d8e7e2] bg-[#fbfefd] px-3 text-sm text-[#10221f] outline-none transition focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
          />
        </label>

        <label className="space-y-1.5 text-xs font-medium text-[#5d716b]">
          Đến ngày
          <input
            type="date"
            disabled
            value={filters.toDate}
            onChange={(event) => updateFilter("toDate", event.target.value)}
            className="h-10 w-full rounded-md border border-[#d8e7e2] bg-[#fbfefd] px-3 text-sm text-[#10221f] outline-none transition focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
          />
        </label>

        <label className="space-y-1.5 text-xs font-medium text-[#5d716b]">
          Bộ môn
          <select
            disabled
            value={filters.discipline}
            onChange={(event) => updateFilter("discipline", event.target.value as DisciplineFilter)}
            className="h-10 w-full rounded-md border border-[#d8e7e2] bg-[#fbfefd] px-3 text-sm text-[#10221f] outline-none transition focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
          >
            {disciplines.map((discipline) => (
              <option key={discipline.value} value={discipline.value}>
                {discipline.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5 text-xs font-medium text-[#5d716b]">
          Hạng vé
          <select
            disabled
            value={filters.membershipTier}
            onChange={(event) => updateFilter("membershipTier", event.target.value)}
            className="h-10 w-full rounded-md border border-[#d8e7e2] bg-[#fbfefd] px-3 text-sm text-[#10221f] outline-none transition focus:border-[#008b74] focus:ring-2 focus:ring-[#008b74]/15"
          >
            {membershipTiers.map((tier) => (
              <option key={tier.value} value={tier.value}>
                {tier.label}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <Button
            type="button"
            variant="mint"
            onClick={onApply}
            disabled
            className="h-10 w-full xl:w-auto"
          >
            Áp dụng
          </Button>
        </div>
      </div>
    </section>
  );
};
