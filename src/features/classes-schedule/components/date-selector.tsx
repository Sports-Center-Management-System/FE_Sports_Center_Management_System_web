import React from "react";
import { DateOption } from "../types";
import { cn } from "@/lib/utils";

export interface DateSelectorProps {
  dates: DateOption[];
  selectedDate: DateOption;
  onSelectDate: (date: DateOption) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onSelectDate,
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
        BƯỚC 1: CHỌN NGÀY TẬP TRONG TUẦN
      </h3>

      <div className="mt-5 grid grid-cols-7 gap-2.5 sm:gap-3">
        {dates.map((item) => {
          const isSelected = item.fullDate === selectedDate.fullDate;
          return (
            <button
              key={item.fullDate}
              type="button"
              onClick={() => onSelectDate(item)}
              className={cn(
                "flex flex-col items-center justify-center rounded-xl py-3 px-1 transition-all duration-150 text-center select-none",
                isSelected
                  ? "bg-[#008b74] text-white shadow-md shadow-[#008b74]/20 scale-[1.02]"
                  : "border border-slate-100 bg-[#f8fafc] text-slate-700 hover:border-slate-300 hover:bg-slate-100/70"
              )}
            >
              <span
                className={cn(
                  "text-[11px] font-medium leading-tight",
                  isSelected ? "text-emerald-100" : "text-slate-500"
                )}
              >
                {item.dayOfWeek}
              </span>
              <span
                className={cn(
                  "mt-1 text-base font-bold leading-none",
                  isSelected ? "text-white" : "text-slate-800"
                )}
              >
                {item.dateNumber}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
