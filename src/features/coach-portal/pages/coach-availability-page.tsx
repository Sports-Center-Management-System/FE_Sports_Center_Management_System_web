import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import { CreateSlotModal } from '../components/create-slot-modal';

export const CoachAvailabilityPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [filter, setFilter] = useState<'ALL' | 'UNBOOKED' | 'BOOKED'>('ALL');

  const {
    data: slots = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['coach', 'availability'],
    queryFn: () => coachPortalApi.getMyAvailability(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachPortalApi.deleteSlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'availability'] });
      queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] });
    },
  });

  // Group slots by date (YYYY-MM-DD)
  const filteredSlots = slots.filter((slot) => {
    if (filter === 'UNBOOKED') return !slot.isBooked && !slot.isEmergencyCancelled;
    if (filter === 'BOOKED') return slot.isBooked;
    return true;
  });

  const groupedSlots = filteredSlots.reduce((acc, slot) => {
    const dateKey = new Date(slot.startTime).toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, typeof slots>);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Khung Giờ Rảnh PT 1-1
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mở các khung giờ rảnh để hội viên có gói VIP hoặc PT Add-on có thể đặt lịch kèm riêng
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs font-bold border-slate-200 bg-white shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Mở khung giờ rảnh</span>
          </Button>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4 text-xs text-emerald-950 shadow-xs">
        <ShieldAlert className="h-5 w-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Quy tắc đặt lịch cá nhân (Mục 1.2 & 6.2):</p>
          <p className="text-[11px] leading-relaxed text-emerald-900">
            Hệ thống sử dụng Transaction Advisory Lock để ngăn chặn tuyệt đối tình trạng đặt trùng giữa lịch rảnh PT và lịch lớp nhóm. Khi hội viên đặt slot rảnh của bạn, slot sẽ tự động chuyển sang trạng thái "Đã có người đặt" và không thể bị người khác đặt lại.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === 'ALL'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tất cả ({slots.length})
        </button>
        <button
          onClick={() => setFilter('UNBOOKED')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === 'UNBOOKED'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Còn trống ({slots.filter((s) => !s.isBooked && !s.isEmergencyCancelled).length})
        </button>
        <button
          onClick={() => setFilter('BOOKED')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
            filter === 'BOOKED'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Đã được đặt ({slots.filter((s) => s.isBooked).length})
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách khung giờ rảnh...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredSlots.length === 0 && (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
          <Clock className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Không có khung giờ rảnh nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn chưa mở khung giờ rảnh nào trong thời gian tới. Hãy bấm nút "Mở khung giờ rảnh" phía trên để tạo slot mới.
          </p>
        </div>
      )}

      {/* Slots Grouped by Date */}
      <div className="space-y-6">
        {Object.entries(groupedSlots).map(([dateLabel, dateSlots]) => (
          <div key={dateLabel} className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-700 uppercase tracking-wide">
              <Calendar className="h-4 w-4 text-emerald-600" />
              <span>{dateLabel}</span>
              <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.2 text-[10px] font-bold">
                {dateSlots.length} slot
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dateSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`rounded-2xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                    slot.isBooked
                      ? 'border-blue-200 bg-gradient-to-br from-blue-50/60 to-white'
                      : slot.isEmergencyCancelled
                      ? 'border-rose-200 bg-rose-50/40'
                      : 'border-slate-200/90 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-sm font-extrabold text-slate-900">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span>
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Thời lượng 60 phút</p>
                    </div>

                    {slot.isBooked ? (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-extrabold">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã có người đặt
                      </span>
                    ) : slot.isEmergencyCancelled ? (
                      <span className="flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-extrabold">
                        <AlertCircle className="h-3 w-3" />
                        Đã hủy khẩn cấp
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-extrabold">
                        <CheckCircle2 className="h-3 w-3" />
                        Còn trống
                      </span>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      ID: {slot.id.slice(0, 8)}...
                    </span>

                    {!slot.isBooked && !slot.isEmergencyCancelled && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm('Bạn có chắc chắn muốn xóa slot rảnh này không?')) {
                            deleteMutation.mutate(slot.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-7 text-xs font-semibold gap-1 px-2"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        <span>Xóa slot</span>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Mở Khung Giờ Rảnh */}
      <CreateSlotModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};
