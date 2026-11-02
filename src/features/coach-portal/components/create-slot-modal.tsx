import React, { useState } from 'react';
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
  // Morning Prime
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
  // Lunch Express
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
  // Evening Peak
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
];

export const CreateSlotModal: React.FC<CreateSlotModalProps> = ({
  isOpen,
  onClose,
  initialDate,
}) => {
  const queryClient = useQueryClient();

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

  // Sync date when initialDate changes
  React.useEffect(() => {
    if (initialDate && initialDate >= todayStr) {
      setDate(initialDate);
    }
  }, [initialDate, todayStr]);

  const isPastDate = date < todayStr;
  const isToday = date === todayStr;
  const [sh, sm] = startTime.split(':').map(Number);
  const isStartTimePast = isToday && (sh * 60 + sm <= currentMinutes);
  const isSlotInPast = isPastDate || isStartTimePast;

  const mutation = useMutation({
    mutationFn: async () => {
      const startDateTime = new Date(`${date}T${startTime}:00`);
      const endDateTime = new Date(`${date}T${endTime}:00`);

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
      const msg = err.response?.data?.message || err.message || 'Lỗi khi mở khung giờ rảnh';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  if (!isOpen) return null;

  const filteredPresets =
    selectedPeriod === 'ALL'
      ? DUTY_PRESETS
      : DUTY_PRESETS.filter((p) => p.period === selectedPeriod);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

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

          {/* Custom Time Selection (Fine-tune) */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-500 block mb-2">
              Hoặc tùy chỉnh giờ cụ thể:
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Giờ bắt đầu
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Giờ kết thúc
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <div className="text-xs font-semibold text-slate-600">
            Ca tập: <span className="text-emerald-700 font-bold">{startTime} - {endTime}</span>
            {(() => {
              const [sh, sm] = startTime.split(':').map(Number);
              const [eh, em] = endTime.split(':').map(Number);
              const diff = (eh * 60 + em) - (sh * 60 + sm);
              if (diff > 0) {
                const h = Math.floor(diff / 60);
                const m = diff % 60;
                const durStr = h > 0 && m > 0 ? `${h} giờ ${m} phút` : h > 0 ? `${h} giờ` : `${m} phút`;
                return <span className="text-slate-500 font-medium"> ({durStr})</span>;
              }
              return null;
            })()}
            {' · '}
            <span className="text-slate-700 font-medium">{new Date(date).toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="text-xs font-semibold"
            >
              Hủy
            </Button>
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
