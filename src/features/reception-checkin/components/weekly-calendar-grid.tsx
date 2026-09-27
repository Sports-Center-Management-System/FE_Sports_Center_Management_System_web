import React, { useState } from "react";
import {
  StaffShift,
  DayColumn,
  ShiftSlot,
} from "../types";
import { STANDARD_2H30_SLOTS } from "../mock-data";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Search,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface WeeklyCalendarGridProps {
  shifts: StaffShift[];
  days: DayColumn[];
  weekRangeLabel: string;
  onPreviousWeek?: () => void;
  onNextWeek?: () => void;
  onCurrentWeek?: () => void;
  onCreateShift: (prefillDate?: string, prefillStartTime?: string, prefillEndTime?: string) => void;
  onEditShift: (shift: StaffShift) => void;
  onDeleteShift: (shift: StaffShift) => void;
}

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  shifts,
  days,
  weekRangeLabel,
  onPreviousWeek,
  onNextWeek,
  onCurrentWeek,
  onCreateShift,
  onEditShift,
  onDeleteShift,
}) => {
  const [searchStaff, setSearchStaff] = useState("");
  const [periodFilter, setPeriodFilter] = useState<string>("ALL");

  const filteredSlots = STANDARD_2H30_SLOTS.filter((slot) => {
    if (periodFilter === "ALL") return true;
    return slot.period === periodFilter;
  });

  const isShiftMatchingSearch = (s: StaffShift) => {
    if (!searchStaff.trim()) return true;
    const q = searchStaff.toLowerCase();
    return (
      s.user.fullName.toLowerCase().includes(q) ||
      s.user.employeeCode.toLowerCase().includes(q) ||
      s.shiftCode.toLowerCase().includes(q)
    );
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      {/* Calendar Top Toolbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-5">
        {/* Week Navigator */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-[#f8fafc] p-1 text-slate-700">
            <button
              type="button"
              onClick={onPreviousWeek}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
              title="Tuần trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-bold text-slate-900 select-none">
              {weekRangeLabel}
            </span>
            <button
              type="button"
              onClick={onNextWeek}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-slate-900 transition-colors"
              title="Tuần sau"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={onCurrentWeek}
            className="rounded-xl border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tuần này
          </Button>

          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f7f2] px-2.5 py-1 text-[11px] font-semibold text-[#008b74]">
            <Clock className="h-3 w-3" /> Ca 2h30p (6 ca / ngày)
          </span>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Shift Filter Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 text-xs">
            {[
              { id: "ALL", label: "Tất cả (6 ca)" },
              { id: "MORNING", label: "Sáng (Ca 1-3)" },
              { id: "AFTERNOON", label: "Chiều (Ca 4)" },
              { id: "EVENING", label: "Tối (Ca 5-6)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all select-none",
                  periodFilter === tab.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search by receptionist */}
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="search"
              value={searchStaff}
              onChange={(e) => setSearchStaff(e.target.value)}
              placeholder="Tìm theo tên hoặc mã..."
              className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-1.5 pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
            />
          </div>

          {/* Create shift button */}
          <Button
            variant="mint"
            size="sm"
            onClick={() => onCreateShift()}
            className="rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Phân ca trực
          </Button>
        </div>
      </div>

      {/* Unified Single Grid Matrix Table (Khắc phục triệt để lệch hàng, lệch cột, lấn ô) */}
      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[1040px] rounded-xl border border-slate-200/90 overflow-hidden bg-white">
          <div className="grid grid-cols-[105px_repeat(7,minmax(0,1fr))] divide-x divide-slate-200/80">
            {/* ====== HEADER ROW ====== */}
            {/* Slot Column Header */}
            <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/80 border-b border-slate-200/90 text-slate-700 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Khung ca</span>
              <span className="text-xs font-bold text-slate-900 mt-0.5">2h30p</span>
            </div>

            {/* 7 Day Column Headers */}
            {days.map((day) => (
              <div
                key={`header-${day.date}`}
                className={cn(
                  "flex flex-col items-center justify-center p-2.5 border-b border-slate-200/90 transition-colors min-w-0",
                  day.isToday ? "bg-[#008b74] text-white" : "bg-[#f8fafc] text-slate-800"
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    day.isToday ? "text-emerald-100" : "text-slate-400"
                  )}
                >
                  {day.dayOfWeek}
                </span>
                <span className="text-sm font-bold font-mono leading-none mt-0.5">
                  {day.dateNumber}
                </span>
              </div>
            ))}

            {/* ====== SLOT ROWS ====== */}
            {filteredSlots.map((slot) => (
              <React.Fragment key={slot.id}>
                {/* 1. Slot Time Label (Left Column) */}
                <div className="flex flex-col items-center justify-center p-2 bg-[#f8fafc]/90 text-center h-[105px] border-b border-slate-200/80 min-w-0">
                  <span className="rounded-md bg-[#e6f7f2] px-1.5 py-0.5 text-[10px] font-bold text-[#008b74]">
                    {slot.name}
                  </span>
                  <span className="mt-1 font-mono text-[11px] font-bold text-slate-800">
                    {slot.startTime}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 leading-none">
                    đến {slot.endTime}
                  </span>
                </div>

                {/* 2. 7 Day Cells for this Slot */}
                {days.map((day) => {
                  const shift = shifts.find(
                    (s) =>
                      s.date === day.date &&
                      s.status !== "CANCELLED" &&
                      s.startTime === slot.startTime
                  );

                  const isVisible = shift ? isShiftMatchingSearch(shift) : true;

                  return (
                    <div
                      key={`${day.date}-${slot.id}`}
                      className={cn(
                        "p-1.5 h-[105px] border-b border-slate-200/80 transition-all min-w-0 overflow-hidden",
                        day.isToday ? "bg-[#f0f9f6]/20" : "bg-white"
                      )}
                    >
                      {shift && isVisible ? (
                        /* Card with exactly 4 balanced rows: Name, Badge/Role, Note/Spacer, Actions */
                        <div className="h-full flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2 shadow-xs transition-all hover:border-[#008b74]/60 hover:shadow-sm min-w-0 overflow-hidden">
                          {/* Row 1: Full Name */}
                          <div className="min-w-0">
                            <p
                              className="text-xs font-bold text-slate-900 truncate leading-snug"
                              title={shift.user.fullName}
                            >
                              {shift.user.fullName}
                            </p>
                          </div>

                          {/* Row 2: Code badge + Role (Never breaks into 2 lines) */}
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 min-w-0 overflow-hidden">
                            <span className="font-mono text-[9px] font-bold text-[#008b74] bg-[#e6f7f2] px-1 py-0.2 rounded whitespace-nowrap shrink-0">
                              {shift.user.employeeCode}
                            </span>
                            <span className="text-slate-300 shrink-0">•</span>
                            <span
                              className="truncate text-slate-500 font-medium text-[10px]"
                              title={shift.user.roleLabel}
                            >
                              {shift.user.roleLabel}
                            </span>
                          </div>

                          {/* Row 3: Single-line Note or spacer with fixed height to align all buttons */}
                          <div className="min-w-0 h-[14px]">
                            {shift.notes ? (
                              <p
                                className="text-[10px] text-slate-400 truncate italic leading-tight"
                                title={shift.notes}
                              >
                                {shift.notes}
                              </p>
                            ) : (
                              <div className="h-[14px]" />
                            )}
                          </div>

                          {/* Row 4: Actions (Sửa / Hủy) strictly aligned horizontally across all 7 days */}
                          <div className="flex items-center justify-end gap-1.5 border-t border-slate-100 pt-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditShift(shift)}
                              className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="Chỉnh sửa hoặc đổi ca"
                            >
                              <Edit2 className="h-2.5 w-2.5 text-slate-400" /> Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteShift(shift)}
                              className="flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                              title="Hủy ca trực"
                            >
                              <Trash2 className="h-2.5 w-2.5 text-rose-400" /> Hủy
                            </button>
                          </div>
                        </div>
                      ) : !isVisible && shift ? (
                        /* Filter non-match placeholder */
                        <div className="h-full flex items-center justify-center rounded-xl bg-slate-50/50 p-1 text-center">
                          <span className="text-[10px] text-slate-300 italic">Ẩn</span>
                        </div>
                      ) : (
                        /* Empty Slot Cell (Identical uniform height, click to add shift for this date & slot) */
                        <button
                          type="button"
                          onClick={() => onCreateShift(day.date, slot.startTime, slot.endTime)}
                          className="group h-full w-full flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/40 p-1 text-slate-400 hover:border-[#008b74] hover:bg-[#e6f7f2]/30 hover:text-[#008b74] transition-all min-w-0"
                          title={`Phân ca cho ${day.dayOfWeek} ${slot.name} (${slot.startTime} - ${slot.endTime})`}
                        >
                          <Plus className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                          <span className="mt-0.5 text-[10px] font-semibold tracking-tight">
                            Phân ca
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
