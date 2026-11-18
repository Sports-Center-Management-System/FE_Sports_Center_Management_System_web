import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  Check,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
}

export type SlotPeriod = 'ALL' | 'MORNING' | 'AFTERNOON' | 'EVENING';

export interface HourlySlotPreset {
  start: string;
  end: string;
  label: string;
  period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  isPeak?: boolean;
}

// 1-hour slots from 05:00 to 21:00 (every 1 hour)
export const HOURLY_SLOTS: HourlySlotPreset[] = [
  // Ca Sáng: 05:00 - 12:00
  { start: '05:00', end: '06:00', label: '05:00 – 06:00', period: 'MORNING' },
  { start: '06:00', end: '07:00', label: '06:00 – 07:00', period: 'MORNING' },
  { start: '07:00', end: '08:00', label: '07:00 – 08:00', period: 'MORNING', isPeak: true },
  { start: '08:00', end: '09:00', label: '08:00 – 09:00', period: 'MORNING' },
  { start: '09:00', end: '10:00', label: '09:00 – 10:00', period: 'MORNING' },
  { start: '10:00', end: '11:00', label: '10:00 – 11:00', period: 'MORNING' },
  { start: '11:00', end: '12:00', label: '11:00 – 12:00', period: 'MORNING' },

  // Ca Chiều: 12:00 - 17:00
  { start: '12:00', end: '13:00', label: '12:00 – 13:00', period: 'AFTERNOON' },
  { start: '13:00', end: '14:00', label: '13:00 – 14:00', period: 'AFTERNOON' },
  { start: '14:00', end: '15:00', label: '14:00 – 15:00', period: 'AFTERNOON' },
  { start: '15:00', end: '16:00', label: '15:00 – 16:00', period: 'AFTERNOON' },
  { start: '16:00', end: '17:00', label: '16:00 – 17:00', period: 'AFTERNOON' },

  // Ca Tối: 17:00 - 21:00
  { start: '17:00', end: '18:00', label: '17:00 – 18:00', period: 'EVENING', isPeak: true },
  { start: '18:00', end: '19:00', label: '18:00 – 19:00', period: 'EVENING', isPeak: true },
  { start: '19:00', end: '20:00', label: '19:00 – 20:00', period: 'EVENING', isPeak: true },
  { start: '20:00', end: '21:00', label: '20:00 – 21:00', period: 'EVENING' },
];

const format24hInput = (val: string): string => {
  const trimmed = val.trim();
  if (/^\d{1,2}$/.test(trimmed)) {
    const h = parseInt(trimmed, 10);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:00`;
  }
  const match = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }
  return trimmed;
};

const DAYS_OF_WEEK = [
  { id: 1, label: 'Thứ 2' },
  { id: 2, label: 'Thứ 3' },
  { id: 3, label: 'Thứ 4' },
  { id: 4, label: 'Thứ 5' },
  { id: 5, label: 'Thứ 6' },
  { id: 6, label: 'Thứ 7' },
  { id: 7, label: 'Chủ Nhật' },
];

const PERIOD_LABEL: Record<HourlySlotPreset['period'], string> = {
  MORNING: 'Sáng',
  AFTERNOON: 'Chiều',
  EVENING: 'Tối',
};

const slotId = (slot: HourlySlotPreset) => `${slot.start}-${slot.end}`;

export const CreateSlotModal: React.FC<CreateSlotModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Time calculations to prevent past slot creation
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Tomorrow by default if no valid initial date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateStr = tomorrow.toISOString().slice(0, 10);

  const [date, setDate] = useState<string>(
    initialDate && initialDate >= todayStr ? initialDate : defaultDateStr
  );
  const [startTime, setStartTime] = useState<string>('07:00');
  const [endTime, setEndTime] = useState<string>('08:00');
  const [selectedPeriod, setSelectedPeriod] = useState<SlotPeriod>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showCustomTime, setShowCustomTime] = useState<boolean>(false);

  // Bulk states
  const [bulkWeekOffset, setBulkWeekOffset] = useState<0 | 1>(0);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // 1=Mon, ..., 7=Sun
  const [selectedBulkTimeSlots, setSelectedBulkTimeSlots] = useState<string[]>([
    '07:00-08:00',
    '08:00-09:00',
    '17:00-18:00',
    '18:00-19:00',
  ]);

  // Sync date when initialDate changes
  useEffect(() => {
    if (initialDate && initialDate >= todayStr) {
      setDate(initialDate);
    }
  }, [initialDate, todayStr]);

  const isPastDate = date < todayStr;
  const isToday = date === todayStr;
  const [sh, sm] = (startTime || '').split(':').map(Number);
  const isStartTimePast = isToday && (!isNaN(sh) && !isNaN(sm) ? sh * 60 + sm <= currentMinutes : false);
  const isSlotInPast = isPastDate || isStartTimePast;

  const mutation = useMutation({
    mutationFn: async () => {
      const normStart = format24hInput(startTime);
      const normEnd = format24hInput(endTime);
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(normStart) || !timeRegex.test(normEnd)) {
        throw new Error('Vui lòng nhập định dạng giờ 24h hợp lệ (HH:mm, ví dụ 06:00, 14:00, 20:00).');
      }

      const startDateTime = new Date(`${date}T${normStart}:00`);
      const endDateTime = new Date(`${date}T${normEnd}:00`);

      if (startDateTime <= new Date()) {
        throw new Error('Khung giờ rảnh mở mới bắt buộc phải nằm ở tương lai.');
      }
      if (endDateTime <= startDateTime) {
        throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
      }

      return coachPortalApi.createSlot({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
      ]);
      onClose();
    },
    onError: (err: any) => {
      let msg = err.response?.data?.message || err.message || 'Lỗi khi mở khung giờ rảnh';
      if (typeof msg !== 'string') msg = JSON.stringify(msg);

      if (msg.includes('SCHEDULE_OR_DATA_CONFLICT') || msg.includes('23P01')) {
        msg =
          'Trùng lịch dạy: Khung giờ này bị trùng lặp hoặc giao thoa với ca rảnh/lịch dạy lớp khác của bạn. Hệ thống cơ sở dữ liệu không cho phép 1 HLV mở 2 ca trùng/chồng chéo thời gian.';
      } else if (msg.includes('SLOT_MUST_BE_FUTURE')) {
        msg = 'Khung giờ mở slot rảnh bắt buộc phải ở thời điểm tương lai.';
      } else if (msg.includes('SLOT_ALREADY_BOOKED')) {
        msg = 'Slot đã có học viên đặt lịch, không thể thay đổi.';
      }
      setErrorMessage(msg);
    },
  });

  // Calculate bulk slots
  const calculatedBulkSlots = useMemo(() => {
    const d = new Date();
    const currentDay = d.getDay();
    const diffToMon = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1) + bulkWeekOffset * 7;
    const monday = new Date(d);
    monday.setDate(diffToMon);
    monday.setHours(0, 0, 0, 0);

    const slots: { startTime: string; endTime: string }[] = [];
    const currentTime = new Date().getTime();

    selectedDays.forEach((dayIndex) => {
      const targetDate = new Date(monday);
      targetDate.setDate(monday.getDate() + (dayIndex - 1));
      // Local calendar date: toISOString() is UTC and lands on the previous day in Vietnam.
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;

      selectedBulkTimeSlots.forEach((slotRange) => {
        const [s, e] = slotRange.split('-');
        const startDt = new Date(`${dateStr}T${s}:00`);
        const endDt = new Date(`${dateStr}T${e}:00`);

        if (startDt.getTime() > currentTime && endDt > startDt) {
          slots.push({
            startTime: startDt.toISOString(),
            endTime: endDt.toISOString(),
          });
        }
      });
    });

    return slots;
  }, [bulkWeekOffset, selectedDays, selectedBulkTimeSlots]);

  // Bulk Slot Mutation
  const bulkMutation = useMutation({
    mutationFn: async () => {
      if (calculatedBulkSlots.length === 0) {
        throw new Error('Chưa có slot tương lai hợp lệ nào được chọn. Vui lòng chọn ít nhất 1 ngày và khung giờ.');
      }
      return coachPortalApi.createSlotsBulk(calculatedBulkSlots);
    },
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
      ]);
      alert(`Đã mở thành công ${data.count || calculatedBulkSlots.length} slot rảnh cho tuần!`);
      onClose();
    },
    onError: (err: any) => {
      let msg = err.response?.data?.message || err.message || 'Lỗi khi mở slot hàng loạt';
      if (typeof msg !== 'string') msg = JSON.stringify(msg);
      if (msg.includes('SCHEDULE_OR_DATA_CONFLICT') || msg.includes('23P01')) {
        msg = 'Một số slot bị trùng lặp với lịch hiện có hoặc ca trực khác. Vui lòng kiểm tra lại.';
      }
      setErrorMessage(msg);
    },
  });

  const filteredSlots = useMemo(() => {
    if (selectedPeriod === 'ALL') return HOURLY_SLOTS;
    return HOURLY_SLOTS.filter((s) => s.period === selectedPeriod);
  }, [selectedPeriod]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header: Clean Light Header with Emerald Clock Badge */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4 sm:p-7 sm:pb-5 bg-white shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Mở Khung Giờ Rảnh PT
                </h3>
                <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5">
                  1-1
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Mở ca trực rảnh từng tiếng (05h – 20h) để học viên đặt lịch dạy kèm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-3"
            title="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 border-b border-slate-100 bg-slate-50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setActiveTab('single');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'single'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Mở 1 ca đơn lẻ</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('bulk');
              setErrorMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'bulk'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Mở hàng loạt cả tuần</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 pt-4 sm:p-7 sm:pt-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'single' ? (
          <>
          {isSlotInPast && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="font-black text-amber-950">Khung giờ không hợp lệ: </strong>
                {isPastDate
                  ? 'Ngày được chọn đã nằm trong quá khứ.'
                  : `Khung giờ bắt đầu (${startTime}) đã qua thời điểm hiện tại. Vui lòng chọn khung giờ ở tương lai.`}
              </div>
            </div>
          )}

          {/* Date Picker Card */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-2">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                Ngày áp dụng slot rảnh
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {new Date(date).toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </span>
            </label>
            <input
              type="date"
              value={date}
              min={todayStr}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Shift Filter Pills (Sáng, Chiều, Tối) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                CHỌN KHUNG GIỜ RẢNH (1 TIẾNG)
              </span>
              <button
                type="button"
                onClick={() => setShowCustomTime((prev) => !prev)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                {showCustomTime ? 'Ẩn tùy chỉnh giờ' : 'Tùy chỉnh giờ lẻ'}
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedPeriod('ALL')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all cursor-pointer ${
                  selectedPeriod === 'ALL'
                    ? 'bg-slate-950 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ca (16)
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('MORNING')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPeriod === 'MORNING'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
             
                Ca Sáng 
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('AFTERNOON')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPeriod === 'AFTERNOON'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
               
                Ca Chiều 
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('EVENING')}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedPeriod === 'EVENING'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                
                Ca Tối 
              </button>
            </div>

            {/* Hourly Slot Grid (05h - 20h) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto pr-1 pt-1">
              {filteredSlots.map((slot) => {
                const isSelected = startTime === slot.start && endTime === slot.end;
                const [psh, psm] = slot.start.split(':').map(Number);
                const isPresetPast =
                  isPastDate || (isToday && psh * 60 + psm <= currentMinutes);

                return (
                  <button
                    key={slot.label}
                    type="button"
                    disabled={isPresetPast}
                    onClick={() => {
                      if (!isPresetPast) {
                        setStartTime(slot.start);
                        setEndTime(slot.end);
                      }
                    }}
                    className={`rounded-2xl border p-3 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer relative ${
                      isPresetPast
                        ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'border-emerald-600 bg-emerald-50/90 ring-2 ring-emerald-500/30 text-emerald-950 shadow-xs'
                        : 'border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black tracking-tight">{slot.label}</span>
                      {isSelected ? (
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : slot.isPeak && !isPresetPast ? (
                        <span className="rounded-md bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.5">
                          Giờ vàng
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500">
     
                      {isPresetPast && (
                        <span className="text-[10px] text-slate-400 font-bold">
                          Đã qua giờ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional Custom Time Inputs */}
            {showCustomTime && (
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 animate-in fade-in duration-100">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Giờ bắt đầu (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Giờ kết thúc (HH:mm)
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>
          </>
          ) : (
            /* Bulk Mode Body */
            <div className="space-y-4">
              {/* Week Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn tuần áp dụng
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkWeekOffset(0)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      bulkWeekOffset === 0
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Tuần Này (Hiện Tại)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkWeekOffset(1)}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      bulkWeekOffset === 1
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Tuần Kế Tiếp (Tuần Sau)
                  </button>
                </div>
              </div>

              {/* Days selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    2. Chọn ngày trong tuần
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5])}
                      className="text-[11px] text-emerald-700 font-bold hover:underline px-1.5 py-0.5"
                    >
                      T2 - T6
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedDays([1, 2, 3, 4, 5, 6, 7])}
                      className="text-[11px] text-emerald-700 font-bold hover:underline px-1.5 py-0.5"
                    >
                      Cả tuần
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((d) => {
                    const isChecked = selectedDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setSelectedDays((prev) =>
                            prev.includes(d.id) ? prev.filter((x) => x !== d.id) : [...prev, d.id]
                          );
                        }}
                        className={`py-2 px-1 text-center rounded-lg border text-xs font-semibold transition-all ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    3. Chọn các khung giờ mở rảnh
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedBulkTimeSlots([
                          ...HOURLY_SLOTS.filter((slot) => slot.isPeak).map(slotId),
                        ])
                      }
                      className="text-[11px] text-emerald-700 font-bold hover:underline px-1.5 py-0.5"
                    >
                      Khung giờ vàng
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {HOURLY_SLOTS.map((slot) => {
                    const id = slotId(slot);
                    const isChecked = selectedBulkTimeSlots.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setSelectedBulkTimeSlots((prev) =>
                            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                          );
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">{slot.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({PERIOD_LABEL[slot.period]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary box */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="text-xs text-emerald-900">
                  <span className="font-bold">Tổng quan: </span>
                  Sẽ tự động tạo <span className="font-extrabold text-emerald-700">{calculatedBulkSlots.length} slot rảnh</span> (đã lọc bỏ các ca trong quá khứ).
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions: Deep Black / Emerald Design */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-white p-6 pt-3 sm:p-7 sm:pt-3 shrink-0">
          {activeTab === 'single' ? (
            <div className="text-xs font-semibold text-slate-600 min-w-0 pr-3">
              <span>Ca đã chọn: </span>
              <strong className="text-emerald-700 font-black">
                {startTime} – {endTime}
              </strong>
              <span className="text-slate-400"> (1 tiếng)</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-600 min-w-0 pr-3">
              Hàng loạt:{' '}
              <strong className="text-emerald-700 font-black">{calculatedBulkSlots.length} ca</strong>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending || bulkMutation.isPending}
              className="text-xs font-bold rounded-xl"
            >
              Hủy
            </Button>
            {activeTab === 'single' ? (
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || isSlotInPast}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-md transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
                isSlotInPast
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-slate-950 hover:bg-slate-800 text-white'
              }`}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>{isSlotInPast ? 'Giờ không hợp lệ' : `Mở slot rảnh (${startTime} - ${endTime})`}</span>
            </button>
            ) : (
              <button
                type="button"
                onClick={() => bulkMutation.mutate()}
                disabled={bulkMutation.isPending || calculatedBulkSlots.length === 0}
                className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-black shadow-md transition active:scale-[0.98] flex items-center gap-1.5 cursor-pointer ${
                  calculatedBulkSlots.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-slate-950 hover:bg-slate-800 text-white'
                }`}
              >
                {bulkMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Layers className="h-4 w-4" />
                )}
                <span>Mở {calculatedBulkSlots.length} slot tuần</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
