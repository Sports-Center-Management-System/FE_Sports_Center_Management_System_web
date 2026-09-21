import React, { useState } from "react";
import { DateOption, TimeSlotOption, Coach, BookingState } from "../types";
import { DateSelector } from "../components/date-selector";
import { TimeSlotSelector } from "../components/time-slot-selector";
import { CoachSelector } from "../components/coach-selector";
import { BookingSummaryCard } from "../components/booking-summary-card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { CheckCircle2 } from "lucide-react";

const INITIAL_DATES: DateOption[] = [
  { dayOfWeek: "Thứ 2", dateNumber: 21, fullDate: "2026-09-21" },
  { dayOfWeek: "Thứ 3", dateNumber: 22, fullDate: "2026-09-22" },
  { dayOfWeek: "Thứ 4", dateNumber: 23, fullDate: "2026-09-23" },
  { dayOfWeek: "Thứ 5", dateNumber: 24, fullDate: "2026-09-24" },
  { dayOfWeek: "Thứ 6", dateNumber: 25, fullDate: "2026-09-25" },
  { dayOfWeek: "Thứ 7", dateNumber: 26, fullDate: "2026-09-26" },
  { dayOfWeek: "Chủ Nhật", dateNumber: 27, fullDate: "2026-09-27" },
];

const INITIAL_TIME_SLOTS: TimeSlotOption[] = [
  { id: "slot-1", startTime: "06:00", endTime: "07:30", label: "06:00 - 07:30" },
  { id: "slot-2", startTime: "08:30", endTime: "10:00", label: "08:30 - 10:00" },
  { id: "slot-3", startTime: "14:00", endTime: "15:30", label: "14:00 - 15:30" },
  { id: "slot-4", startTime: "16:00", endTime: "17:30", label: "16:00 - 17:30" },
  { id: "slot-5", startTime: "18:00", endTime: "19:30", label: "18:00 - 19:30" },
  { id: "slot-6", startTime: "20:00", endTime: "21:30", label: "20:00 - 21:30" },
];

const INITIAL_COACHES: Coach[] = [
  {
    id: "coach-1",
    name: "Trần Văn Hoàng",
    specialty: "PT Đã phân công",
    avatarUrl:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=150&q=80",
    rating: 5.0,
    reviewCount: 48,
    isAssigned: true,
    experienceYears: 6,
  },
  {
    id: "coach-2",
    name: "Nguyễn Quỳnh Anh",
    specialty: "Chuyên gia Pilates / Yoga",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
    rating: 4.9,
    reviewCount: 52,
    isAssigned: false,
    experienceYears: 5,
  },
  {
    id: "coach-3",
    name: "Lê Hoàng Nam",
    specialty: "Huấn luyện viên Kickboxing & Thể lực",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
    rating: 4.8,
    reviewCount: 39,
    isAssigned: false,
    experienceYears: 4,
  },
  {
    id: "coach-4",
    name: "Đặng Bảo Ngọc",
    specialty: "Chuyên gia Phục hồi chức năng & Stretching",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
    rating: 4.9,
    reviewCount: 41,
    isAssigned: false,
    experienceYears: 7,
  },
];

export const BookingPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<DateOption>(INITIAL_DATES[3]); // Thứ 5 - 24
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotOption>(INITIAL_TIME_SLOTS[4]); // 18:00 - 19:30
  const [selectedCoach, setSelectedCoach] = useState<Coach>(INITIAL_COACHES[0]); // Trần Văn Hoàng
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const bookingState: BookingState = {
    selectedDate,
    selectedTimeSlot,
    selectedCoach,
    servicePackageName: "Elite Wellness PT",
  };

  const handleOpenConfirm = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmBooking = () => {
    setIsConfirmModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  return (
    <div className="w-full">
      {/* 2-Column Layout starting at the exact same top level */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: 3 Steps */}
        <div className="space-y-6 lg:col-span-8">
          {/* Step 1: Date in week */}
          <DateSelector
            dates={INITIAL_DATES}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />

          {/* Step 2: Time slot */}
          <TimeSlotSelector
            timeSlots={INITIAL_TIME_SLOTS}
            selectedSlot={selectedTimeSlot}
            onSelectSlot={setSelectedTimeSlot}
          />

          {/* Step 3: Coach Selection with Search & Stars Sort */}
          <CoachSelector
            coaches={INITIAL_COACHES}
            selectedCoach={selectedCoach}
            onSelectCoach={setSelectedCoach}
          />
        </div>

        {/* Right Column: Booking Summary Card perfectly level with top */}
        <div className="lg:col-span-4 sticky top-0">
          <BookingSummaryCard
            booking={bookingState}
            onConfirmBooking={handleOpenConfirm}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={isConfirmModalOpen}
        onOpenChange={setIsConfirmModalOpen}
        title="Xác nhận lịch tập"
        description={`Bạn có chắc chắn muốn đặt lịch tập 1-kèm-1 với HLV ${selectedCoach.name} vào ${selectedDate.dayOfWeek} (${selectedDate.dateNumber}) lúc ${selectedTimeSlot.label} không? Buổi tập sẽ được trừ vào gói ${bookingState.servicePackageName}.`}
        confirmText="Xác nhận đặt"
        cancelText="Kiểm tra lại"
        onConfirm={handleConfirmBooking}
      />

      {/* Success Dialog */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in-0">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-[#008b74]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              Đặt lịch hẹn thành công!
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600">
              Lịch tập với HLV <span className="font-bold text-slate-800">{selectedCoach.name}</span> lúc <span className="font-bold text-[#008b74]">{selectedTimeSlot.label} ({selectedDate.dayOfWeek})</span> đã được ghi nhận.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="mt-6 w-full rounded-xl bg-[#008b74] py-2.5 text-xs font-bold text-white transition-all hover:bg-[#007461]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
