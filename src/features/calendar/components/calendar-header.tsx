import React from "react";
import {
  CalendarViewMode,
  Discipline,
  CalendarSubscription,
} from "../types/calendar.types";
import { formatRangeLabel } from "../utils/calendar-date.utils";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Dumbbell,
  UserCheck,
  Users,
  LogOut,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

interface CalendarHeaderProps {
  currentWeek: string;
  onWeekChange: (direction: "prev" | "next") => void;
  onGoToCurrentWeek: () => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (view: CalendarViewMode) => void;
  selectedDisciplineId: string;
  onDisciplineChange: (disciplineId: string) => void;
  disciplines: Discipline[];
  subscriptions: CalendarSubscription[];
  isLoading?: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentWeek,
  onWeekChange,
  onGoToCurrentWeek,
  viewMode,
  onViewModeChange,
  selectedDisciplineId,
  onDisciplineChange,
  disciplines,
  subscriptions,
  isLoading,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#008b74] to-[#005f4f] flex items-center justify-center text-white shadow-md shadow-emerald-900/10">
                <Dumbbell className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                    Lịch tập & Đặt chỗ
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Hội viên
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Thời khóa biểu trung tâm theo tuần (Asia/Ho_Chi_Minh)
                </p>
              </div>
            </div>

            {/* User profile / Logout on mobile */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 text-slate-500 hover:text-rose-600 rounded-lg border border-slate-200 hover:bg-slate-50"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Navigation Controls: Today, Prev, Next, Range */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onGoToCurrentWeek}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition shadow-2xs"
            >
              <CalendarIcon className="h-3.5 w-3.5 text-[#008b74]" />
              Tuần này
            </button>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => onWeekChange("prev")}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
                title="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-3 text-xs font-semibold text-slate-800 min-w-[130px] text-center select-none">
                {formatRangeLabel(currentWeek)}
              </span>
              <button
                type="button"
                onClick={() => onWeekChange("next")}
                className="p-1.5 rounded-md hover:bg-white text-slate-600 hover:text-slate-900 transition shadow-xs"
                title="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Desktop User Info & Logout */}
            <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200">
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 line-clamp-1">
                  {user?.fullName || "Hội viên"}
                </div>
                <div className="text-[10px] text-slate-500">{user?.email}</div>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter bar & Subscriptions Summary */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* View Mode Filters & Discipline Select */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View filter buttons */}
            <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => onViewModeChange("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition flex items-center gap-1.5",
                  viewMode === "all"
                    ? "bg-white text-slate-900 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span>Tất cả</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("group")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition flex items-center gap-1.5",
                  viewMode === "group"
                    ? "bg-white text-sky-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="h-3.5 w-3.5 text-sky-600" />
                <span>Lớp nhóm</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("pt")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition flex items-center gap-1.5",
                  viewMode === "pt"
                    ? "bg-white text-purple-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                <span>HLV kèm 1-1 (PT)</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("mine")}
                className={cn(
                  "px-2.5 py-1 rounded-md transition flex items-center gap-1.5",
                  viewMode === "mine"
                    ? "bg-white text-emerald-700 font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Lịch của tôi</span>
              </button>
            </div>

            {/* Discipline Dropdown */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={selectedDisciplineId}
                  onChange={(e) => onDisciplineChange(e.target.value)}
                  className="appearance-none pl-7 pr-8 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008b74]/20 focus:border-[#008b74]"
                >
                  <option value="all">Tất cả bộ môn</option>
                  {disciplines.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <Filter className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {isLoading && (
              <span className="text-xs text-slate-400 animate-pulse flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                Đang đồng bộ...
              </span>
            )}
          </div>

            {/* Active Subscriptions Quota Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              Gói & Quota:
            </span>
            {subscriptions && subscriptions.length > 0 ? (
              subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-700"
                  title={`Hạn sử dụng đến: ${new Date(sub.endDate).toLocaleDateString("vi-VN")}`}
                >
                  <span className="font-bold text-slate-800">{sub.planName}</span>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <span className="px-1.5 py-0.2 rounded bg-sky-100 text-sky-800 font-semibold">
                      Nhóm: {sub.remainingGroupSessions}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                      PT: {sub.remainingPtSessions}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">
                Chưa có gói tập khả dụng
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
