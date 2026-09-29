import React from "react";
import { Search, Filter, Dumbbell } from "lucide-react";
import { Discipline, PackageTier } from "../types/plans.types";

interface PlanFilterProps {
  disciplines: Discipline[];
  selectedDisciplineId: string;
  onSelectDiscipline: (id: string) => void;
  selectedTier: string;
  onSelectTier: (tier: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalCount: number;
}

const TIER_OPTIONS: { label: string; value: string }[] = [
  { label: "Tất cả hạng gói", value: "ALL" },
  { label: "Gói Trải nghiệm (Trial)", value: "TRIAL" },
  { label: "Gói Tiêu chuẩn (Plus)", value: "PLUS" },
  { label: "Gói Cao cấp (VIP)", value: "VIP" },
  { label: "Gói Cơ bản (Basic)", value: "BASIC" },
];

export const PlanFilter: React.FC<PlanFilterProps> = ({
  disciplines,
  selectedDisciplineId,
  onSelectDiscipline,
  selectedTier,
  onSelectTier,
  searchQuery,
  onSearchChange,
  totalCount,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 mb-8">
      {/* Search and stats bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tên gói tập hoặc quyền lợi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#008b74] transition"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-lg">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Đang hiển thị: <strong className="text-slate-800">{totalCount}</strong> gói tập</span>
          </div>
        </div>
      </div>

      {/* Discipline Tabs */}
      <div className="pt-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Dumbbell className="w-4 h-4 text-[#008b74]" />
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Bộ môn luyện tập
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectDiscipline("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedDisciplineId === "ALL"
                ? "bg-[#008b74] text-white shadow-sm shadow-[#008b74]/20"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
            }`}
          >
            Tất cả bộ môn
          </button>
          {disciplines.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDiscipline(d.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedDisciplineId === d.id
                  ? "bg-[#008b74] text-white shadow-sm shadow-[#008b74]/20"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Package Tier Pills */}
      <div className="pt-3 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Phân hạng gói
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {TIER_OPTIONS.map((tier) => (
            <button
              key={tier.value}
              type="button"
              onClick={() => onSelectTier(tier.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTier === tier.value
                  ? "bg-slate-900 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
