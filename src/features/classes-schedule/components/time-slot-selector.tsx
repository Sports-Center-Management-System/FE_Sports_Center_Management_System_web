import React from "react";
import { Clock } from "lucide-react";
import { TimeSlotOption } from "../types";
import { cn } from "@/lib/utils";

export interface TimeSlotSelectorProps {
  timeSlots: TimeSlotOption[];
  selectedSlot: TimeSlotOption;
  onSelectSlot: (slot: TimeSlotOption) => void;
}

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  timeSlots,
  selectedSlot,
  onSelectSlot,
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-bold tracking-tight text-slate-800 uppercase">
        BƯỚC 2: CHỌN KHUNG GIỜ TẬP
      </h3>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {timeSlots.map((slot) => {
          const isSelected = slot.id === selectedSlot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => onSelectSlot(slot)}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl py-3 px-3.5 text-xs font-semibold transition-all duration-150 select-none",
                isSelected
                  ? "border-2 border-[#008b74] bg-[#e6f7f2] text-[#008b74] shadow-sm font-bold"
                  : "border border-slate-200/80 bg-[#f8fafc] text-slate-700 hover:border-slate-300 hover:bg-slate-100/70"
              )}
            >
              <Clock
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isSelected ? "text-[#008b74]" : "text-slate-400"
                )}
              />
              <span>{slot.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
