import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type { StudentBookingItem, AttendanceStatus } from '../types/coach-portal.types';

interface AttendanceModalProps {
  booking: StudentBookingItem;
  sessionStartTime?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  booking,
  sessionStartTime,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const currentAttendance = booking.attendance;

  const isNotStarted = Boolean(
    sessionStartTime && new Date(sessionStartTime) > new Date()
  );

  const [status, setStatus] = useState<AttendanceStatus>(
    currentAttendance?.status || 'ATTENDED'
  );
  const [notes, setNotes] = useState<string>(currentAttendance?.notes || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isNotStarted) {
        throw new Error(
          'Ca tập chưa đến giờ bắt đầu. Vui lòng quay lại điểm danh khi buổi học diễn ra.'
        );
      }
      if (currentAttendance?.id) {
        return coachPortalApi.updateCheckin(currentAttendance.id, {
          status,
          notes: notes.trim() || undefined,
        });
      }
      return coachPortalApi.classCheckin({
        bookingId: booking.id,
        status,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'member-attendances'] }),
      ]);
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu điểm danh';
      const formatted =
        typeof msg === 'string'
          ? msg.includes('SESSION_NOT_STARTED')
            ? 'Ca tập chưa đến giờ bắt đầu. Vui lòng quay lại điểm danh khi buổi học diễn ra.'
            : msg
          : JSON.stringify(msg);
      setErrorMessage(formatted);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Điểm danh & Nhật ký buổi tập</h3>
            <p className="text-xs text-slate-500">
              Học viên: {booking.member?.fullName || (booking.memberId ? `#${booking.memberId.slice(0, 8)}` : 'Học viên')}
            </p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isNotStarted && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold">Ca tập chưa đến giờ bắt đầu</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Theo quy định hệ thống, tính năng điểm danh chỉ được mở khi buổi tập chính thức bắt đầu (từ{' '}
                  {sessionStartTime
                    ? new Date(sessionStartTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                  ). Bạn có thể xem trước thông tin học viên tại đây.
                </p>
              </div>
            </div>
          )}

          {/* Member Summary */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm uppercase overflow-hidden shrink-0">
              {booking.member?.avatarUrl ? (
                <img
                  src={booking.member.avatarUrl}
                  alt={booking.member?.fullName || 'Học viên'}
                  className="h-full w-full object-cover"
                />
              ) : (
                (booking.member?.fullName?.charAt(0) || 'H')
              )}
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-slate-900 truncate">
                {booking.member?.fullName || (booking.memberId ? `Học viên (#${booking.memberId.slice(0, 8)})` : 'Học viên')}
              </p>
              <p className="text-slate-500">{booking.member?.phone || 'Chưa có SĐT'}</p>
              {booking.member?.memberProfile?.fitnessGoals && (
                <p className="text-[11px] text-emerald-800 mt-0.5 line-clamp-1">
                  Mục tiêu: {booking.member.memberProfile.fitnessGoals}
                </p>
              )}
            </div>
          </div>

          {/* Attendance Status Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Trạng thái có mặt
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('ATTENDED')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === 'ATTENDED'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Có mặt (Attended)</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('ABSENT')}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition-all ${
                  status === 'ABSENT'
                    ? 'border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <X className="h-4 w-4 text-rose-600" />
                <span>Vắng mặt (Absent)</span>
              </button>
            </div>
          </div>

          {/* Tracking Log / Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Nhật ký tập luyện & Nhận xét của HLV
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chép thể lực, mức tạ, kỹ thuật động tác hoặc nhận xét sau buổi tập..."
              rows={4}
              maxLength={2000}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {notes.length}/2000 ký tự
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
            className="text-xs font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={isNotStarted || mutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>{isNotStarted ? 'Chưa đến giờ tập' : 'Lưu điểm danh'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
