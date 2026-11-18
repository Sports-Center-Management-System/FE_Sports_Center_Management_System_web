import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  X,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  Plus,
  Sparkles,
  Sun,
  Sunset,
  Coffee,
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

interface DutyShiftPreset {
  period: 'MORNING' | 'LUNCH' | 'EVENING';
  label: string;
  start: string;
  end: string;
  isPeak?: boolean;
  desc: string;
}

const DUTY_PRESETS: DutyShiftPreset[] = [
  // Morning Shifts
  {
    period: 'MORNING',
    label: '06:00 - 10:00 (4h)',
    start: '06:00',
    end: '10:00',
    isPeak: true,
    desc: 'Ca trực sáng dài 4 tiếng (06h - 10h)',
  },
  {
    period: 'MORNING',
    label: '06:00 - 07:00',
    start: '06:00',
    end: '07:00',
    desc: 'Khởi đầu ngày mới trước giờ công sở',
  },
  {
    period: 'MORNING',
    label: '07:00 - 08:00',
    start: '07:00',
    end: '08:00',
    isPeak: true,
    desc: 'Khung giờ vàng hội viên văn phòng',
  },
  {
    period: 'MORNING',
    label: '08:00 - 09:00',
    start: '08:00',
    end: '09:00',
    desc: 'Ca sáng năng lượng',
  },
  {
    period: 'MORNING',
    label: '09:00 - 10:00',
    start: '09:00',
    end: '10:00',
    desc: 'Ca giữa buổi sáng',
  },
  // Lunch Shifts
  {
    period: 'LUNCH',
    label: '11:30 - 12:30',
    start: '11:30',
    end: '12:30',
    desc: 'Tập nhanh thể lực giờ nghỉ trưa',
  },
  {
    period: 'LUNCH',
    label: '12:30 - 13:30',
    start: '12:30',
    end: '13:30',
    desc: 'Duy trì vóc dáng đầu giờ chiều',
  },
  // Afternoon & Evening Shifts
  {
    period: 'EVENING',
    label: '14:00 - 18:00 (4h)',
    start: '14:00',
    end: '18:00',
    desc: 'Ca trực chiều dài 4 tiếng (14h - 18h)',
  },
  {
    period: 'EVENING',
    label: '17:00 - 21:00 (4h)',
    start: '17:00',
    end: '21:00',
    isPeak: true,
    desc: 'Ca trực tối dài 4 tiếng (17h - 21h)',
  },
  {
    period: 'EVENING',
    label: '17:00 - 18:00',
    start: '17:00',
    end: '18:00',
    desc: 'Tập ngay sau giờ tan sở',
  },
  {
    period: 'EVENING',
    label: '18:00 - 19:00',
    start: '18:00',
    end: '19:00',
    isPeak: true,
    desc: 'Khung giờ nhu cầu PT cao nhất ngày',
  },
  {
    period: 'EVENING',
    label: '19:00 - 20:00',
    start: '19:00',
    end: '20:00',
    isPeak: true,
    desc: 'Khung giờ vàng buổi tối',
  },
  {
    period: 'EVENING',
    label: '20:00 - 21:00',
    start: '20:00',
    end: '21:00',
    desc: 'Ca muộn xả stress cuối ngày',
  },
  {
    period: 'EVENING',
    label: '21:00 - 22:00',
    start: '21:00',
    end: '22:00',
    desc: 'Ca đêm dành cho hội viên tập muộn',
  },
];

// 24-hour time options from 05:00 to 23:00 (30-minute intervals)
const TIME_OPTIONS_24H: string[] = [];
for (let h = 5; h <= 23; h++) {
  const hh = String(h).padStart(2, '0');
  TIME_OPTIONS_24H.push(`${hh}:00`);
  if (h < 23) {
    TIME_OPTIONS_24H.push(`${hh}:30`);
  }
}

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
  const [selectedPeriod, setSelectedPeriod] = useState<'ALL' | 'MORNING' | 'LUNCH' | 'EVENING'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  React.useEffect(() => {
    if (initialDate && initialDate >= todayStr) {
      setDate(initialDate);
    }
  }, [initialDate, todayStr]);

  const isPastDate = date < todayStr;
  const isToday = date === todayStr;
  const [sh, sm] = (startTime || '').split(':').map(Number);
  const isStartTimePast = isToday && (!isNaN(sh) && !isNaN(sm) ? sh * 60 + sm <= currentMinutes : false);
  const isSlotInPast = isPastDate || isStartTimePast;

  // Single Slot Mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const normStart = format24hInput(startTime);
      const normEnd = format24hInput(endTime);
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(normStart) || !timeRegex.test(normEnd)) {
        throw new Error('Vui lòng nhập định dạng giờ 24h hợp lệ (HH:mm, ví dụ 06:00, 14:00, 22:00).');
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
      const dateStr = targetDate.toISOString().slice(0, 10);

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

  if (!isOpen) return null;

  const filteredPresets =
    selectedPeriod === 'ALL'
      ? DUTY_PRESETS
      : DUTY_PRESETS.filter((p) => p.period === selectedPeriod);

  const BULK_SLOT_OPTIONS = [
    { id: '06:00-07:00', label: '06:00 - 07:00', period: 'Sáng' },
    { id: '07:00-08:00', label: '07:00 - 08:00', period: 'Sáng' },
    { id: '08:00-09:00', label: '08:00 - 09:00', period: 'Sáng' },
    { id: '09:00-10:00', label: '09:00 - 10:00', period: 'Sáng' },
    { id: '11:30-12:30', label: '11:30 - 12:30', period: 'Trưa' },
    { id: '12:30-13:30', label: '12:30 - 13:30', period: 'Trưa' },
    { id: '14:00-15:00', label: '14:00 - 15:00', period: 'Chiều' },
    { id: '15:00-16:00', label: '15:00 - 16:00', period: 'Chiều' },
    { id: '16:00-17:00', label: '16:00 - 17:00', period: 'Chiều' },
    { id: '17:00-18:00', label: '17:00 - 18:00', period: 'Tối' },
    { id: '18:00-19:00', label: '18:00 - 19:00', period: 'Tối' },
    { id: '19:00-20:00', label: '19:00 - 20:00', period: 'Tối' },
    { id: '20:00-21:00', label: '20:00 - 21:00', period: 'Tối' },
  ];

  const DAYS_OF_WEEK = [
    { id: 1, label: 'Thứ 2' },
    { id: 2, label: 'Thứ 3' },
    { id: 3, label: 'Thứ 4' },
    { id: 4, label: 'Thứ 5' },
    { id: 5, label: 'Thứ 6' },
    { id: 6, label: 'Thứ 7' },
    { id: 7, label: 'Chủ Nhật' },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/30">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Mở Khung Giờ Rảnh PT</h3>
                <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5">
                  COACH_DUTY
                </span>
              </div>
              <p className="text-xs text-slate-500">Mở slot 1-1 cho hội viên VIP và PT Add-on</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-100/60 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Mở 1 Ca Đơn Lẻ</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mở Hàng Loạt Cả Tuần (Bulk)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'single' ? (
            <>
              {isSlotInPast && (
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <span className="font-bold">Khung giờ không hợp lệ: </span>
                    {isPastDate
                      ? 'Ngày được chọn đã nằm trong quá khứ.'
                      : `Khung giờ bắt đầu (${startTime}) đã qua thời điểm hiện tại. Vui lòng chọn khung giờ ở tương lai.`}
                  </div>
                </div>
              )}

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  Ngày áp dụng slot
                </label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Period Filter for Duty Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>Khung giờ gợi ý phổ biến</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Bấm để chọn nhanh</span>
                </div>

                <div className="flex items-center gap-1.5 pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('ALL')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                      selectedPeriod === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Tất cả ca
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('MORNING')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedPeriod === 'MORNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <Sun className="h-3 w-3" />
                    Ca Sáng (06-09h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('LUNCH')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedPeriod === 'LUNCH'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    <Coffee className="h-3 w-3" />
                    Ca Trưa (11-13h)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPeriod('EVENING')}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all flex items-center gap-1 ${
                      selectedPeriod === 'EVENING'
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    <Sunset className="h-3 w-3" />
                    Ca Tối (17-21h)
                  </button>
                </div>

                {/* Presets Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => {
                    const isSelected = startTime === preset.start && endTime === preset.end;
                    const [psh, psm] = preset.start.split(':').map(Number);
                    const isPresetPast = isPastDate || (isToday && (psh * 60 + psm <= currentMinutes));

                    return (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={isPresetPast}
                        onClick={() => {
                          if (!isPresetPast) {
                            setStartTime(preset.start);
                            setEndTime(preset.end);
                          }
                        }}
                        className={`rounded-xl border p-2.5 text-left transition-all flex flex-col justify-between ${
                          isPresetPast
                            ? 'border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20 text-emerald-950'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black">{preset.label}</span>
                          {isPresetPast ? (
                            <span className="rounded-md bg-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5">
                              Đã qua giờ
                            </span>
                          ) : preset.isPeak ? (
                            <span className="rounded-md bg-amber-100 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.2">
                              Giờ vàng ★
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                          {isPresetPast ? 'Đã quá thời điểm hiện tại' : preset.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
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
                          '06:00-07:00',
                          '07:00-08:00',
                          '08:00-09:00',
                          '17:00-18:00',
                          '18:00-19:00',
                          '19:00-20:00',
                        ])
                      }
                      className="text-[11px] text-emerald-700 font-bold hover:underline px-1.5 py-0.5"
                    >
                      Khung giờ vàng
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                  {BULK_SLOT_OPTIONS.map((slot) => {
                    const isChecked = selectedBulkTimeSlots.includes(slot.id);
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedBulkTimeSlots((prev) =>
                            prev.includes(slot.id)
                              ? prev.filter((x) => x !== slot.id)
                              : [...prev, slot.id]
                          );
                        }}
                        className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs">{slot.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({slot.period})</span>
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

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          {activeTab === 'single' ? (
            <div className="text-xs font-semibold text-slate-600">
              Ca tập: <span className="text-emerald-700 font-bold">{startTime} - {endTime}</span>
              {' · '}
              <span className="text-slate-700 font-medium">{new Date(date).toLocaleDateString('vi-VN')}</span>
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-600">
              Hàng loạt: <span className="text-emerald-700 font-bold">{calculatedBulkSlots.length} ca</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending || bulkMutation.isPending}
              className="text-xs font-semibold"
            >
              Hủy
            </Button>
            {activeTab === 'single' ? (
              <Button
                type="button"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending || isSlotInPast}
                className={`text-xs font-bold gap-1.5 shadow-sm transition-all ${
                  isSlotInPast
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300 shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>{isSlotInPast ? 'Giờ trong quá khứ' : 'Mở slot rảnh'}</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => bulkMutation.mutate()}
                disabled={bulkMutation.isPending || calculatedBulkSlots.length === 0}
                className={`text-xs font-bold gap-1.5 shadow-sm transition-all ${
                  calculatedBulkSlots.length === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed hover:bg-slate-300 shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {bulkMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Layers className="h-3.5 w-3.5" />
                )}
                <span>Mở {calculatedBulkSlots.length} slot tuần</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
