import React from "react";
import { Info, Calendar, Clock, UserCheck, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingState } from "../types";

export interface BookingSummaryCardProps {
  booking: BookingState;
  onConfirmBooking: () => void;
  isLoading?: boolean;
}

export const BookingSummaryCard: React.FC<BookingSummaryCardProps> = ({
  booking,
  onConfirmBooking,
  isLoading = false,
}) => {
  const { selectedDate, selectedTimeSlot, selectedCoach, servicePackageName } =
    booking;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-7 shadow-sm">
      <div>
        <h3 className="text-lg font-bold tracking-tight text-slate-900">
          Tóm tắt lịch đặt
        </h3>

        {/* Details list */}
        <div className="mt-6 space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-slate-500">Gói dịch vụ trừ buổi:</span>
            <span className="font-bold text-slate-800">{servicePackageName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-slate-500">Huấn luyện viên:</span>
            <span className="font-bold text-slate-900">{selectedCoach?.name || "Chưa chọn"}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-slate-500">Ngày tập:</span>
            <span className="font-bold text-[#008b74]">
              {selectedDate ? `${selectedDate.dayOfWeek}, ngày ${selectedDate.dateNumber} này` : "Chưa chọn"}
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-50 pb-3">
            <span className="text-slate-500">Khung giờ:</span>
            <span className="font-bold text-[#008b74]">
              {selectedTimeSlot?.label || "Chưa chọn"}
            </span>
          </div>
        </div>

        {/* Cancellation Notice Policy */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-sky-100 bg-[#eef7fc] p-4 text-[11px] leading-relaxed text-sky-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-500" />
          <p>
            Vui lòng huỷ lịch tập trước 2 tiếng nếu có công việc đột xuất để tránh mất buổi tập định kỳ.
          </p>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-7">
        <Button
          onClick={onConfirmBooking}
          disabled={isLoading}
          className="w-full rounded-xl bg-[#008b74] py-3.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#007461] hover:shadow-md active:scale-[0.99]"
        >
          {isLoading ? "Đang xử lý đặt lịch..." : "Xác nhận Đặt lịch hẹn"}
        </Button>
      </div>
    </div>
  );
};
