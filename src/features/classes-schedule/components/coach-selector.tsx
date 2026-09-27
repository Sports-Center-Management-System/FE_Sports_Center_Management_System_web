import React, { useState, useMemo } from "react";
import { Search, Star, ArrowUpDown, Award, CheckCircle } from "lucide-react";
import { Coach } from "../types";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface CoachSelectorProps {
  coaches: Coach[];
  selectedCoach: Coach;
  onSelectCoach: (coach: Coach) => void;
}

export const CoachSelector: React.FC<CoachSelectorProps> = ({
  coaches,
  selectedCoach,
  onSelectCoach,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "assigned" | "experience">("assigned");

  const filteredAndSortedCoaches = useMemo(() => {
    return coaches
      .filter((c) => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;
        return (
          c.name.toLowerCase().includes(query) ||
          c.specialty.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortBy === "rating") {
          return b.rating - a.rating;
        }
        if (sortBy === "reviews") {
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        }
        if (sortBy === "experience") {
          return (b.experienceYears || 0) - (a.experienceYears || 0);
        }
        // default "assigned" -> assigned coach first
        if (a.isAssigned && !b.isAssigned) return -1;
        if (!a.isAssigned && b.isAssigned) return 1;
        return b.rating - a.rating;
      });
  }, [coaches, searchQuery, sortBy]);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {/* Step Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
          BƯỚC 3: CHỌN HUẤN LUYỆN VIÊN (COACH)
        </h3>
        <span className="text-xs text-slate-500">
          Hiển thị {filteredAndSortedCoaches.length} huấn luyện viên
        </span>
      </div>

      {/* Search and Sort Toolbar */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search input for coach */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm HLV theo tên hoặc chuyên môn (Gym, Yoga, Pilates...)"
            className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 pl-10 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#008b74]/15 transition-all"
          />
        </div>

        {/* Sort by rating stars selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none rounded-xl border border-slate-200 bg-[#f8fafc] py-2 pl-3 pr-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 focus:border-[#008b74] focus:outline-none focus:ring-2 focus:ring-[#008b74]/15 cursor-pointer"
            >
              <option value="assigned">⭐ Đề xuất (HLV chỉ định)</option>
              <option value="rating">⭐ Đánh giá sao cao nhất</option>
              <option value="reviews">💬 Nhiều đánh giá nhất</option>
              <option value="experience">🏆 Kinh nghiệm lâu năm</option>
            </select>
            <ArrowUpDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Coach Cards Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAndSortedCoaches.map((coach) => {
          const isSelected = coach.id === selectedCoach.id;
          return (
            <div
              key={coach.id}
              onClick={() => onSelectCoach(coach)}
              className={cn(
                "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl p-6 text-center transition-all duration-200 select-none",
                isSelected
                  ? "border-2 border-[#008b74] bg-[#f0faf6] shadow-md shadow-[#008b74]/10"
                  : "border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm"
              )}
            >
              {/* Selected Badge Check */}
              {isSelected && (
                <span className="absolute right-3.5 top-3.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#008b74] text-white shadow-sm">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              )}

              {/* Coach Avatar */}
              <div className="relative">
                <Avatar
                  src={coach.avatarUrl}
                  alt={coach.name}
                  fallback={coach.name.substring(0, 2)}
                  size="xl"
                  className={cn(
                    "h-16 w-16 border-2 transition-transform duration-200 group-hover:scale-105",
                    isSelected ? "border-[#008b74]" : "border-slate-200"
                  )}
                />
              </div>

              {/* Coach Info */}
              <h4 className="mt-3 text-sm font-bold text-slate-900 tracking-tight">
                {coach.name}
              </h4>
              <p className="mt-0.5 text-xs font-medium text-slate-500">
                {coach.specialty}
              </p>

              {/* Star Rating Badge */}
              <div className="mt-2.5 flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
                <div className="flex items-center text-amber-500">
                  <Star className="h-3 w-3 fill-amber-400" />
                </div>
                <span>{coach.rating.toFixed(1)}</span>
                <span className="text-amber-600/70 font-normal">
                  ({coach.reviewCount} đánh giá)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAndSortedCoaches.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-400">
          Không tìm thấy huấn luyện viên phù hợp với từ khóa "{searchQuery}".
        </div>
      )}
    </div>
  );
};
