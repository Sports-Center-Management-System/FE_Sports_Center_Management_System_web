import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, X, Loader2, ShieldAlert, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';

interface EmergencyCancelModalProps {
  scheduleId?: string;
  bookingId?: string;
  sessionTitle: string;
  sessionTime: string;
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyCancelModal: React.FC<EmergencyCancelModalProps> = ({
  scheduleId,
  bookingId,
  sessionTitle,
  sessionTime,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [reasonMessage, setReasonMessage] = useState<string>('');
  const [internalNote, setInternalNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const isReasonValid = reasonMessage.trim().length >= 20;

  const mutation = useMutation({
    mutationFn: async () => {
      if (!isReasonValid) {
        throw new Error('Lời nhắn xin lỗi học viên phải có tối thiểu 20 ký tự.');
      }
      return coachPortalApi.requestEmergencyCancel({
        scheduleId,
        bookingId,
        reasonMessage: reasonMessage.trim(),
        internalNote: internalNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setIsSuccess(true);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'today-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'multi-day-schedule'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'cancellation-requests'] }),
      ]);
      setTimeout(() => {
        setIsSuccess(false);
        setReasonMessage('');
        setInternalNote('');
        onClose();
      }, 1800);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi gửi yêu cầu hủy lịch';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 px-6 py-4 bg-rose-50/70">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">Báo Hủy Lịch Dạy Khẩn Cấp</h3>
              <p className="text-xs text-rose-700">Quy trình phê duyệt 2 tầng & Bảo vệ quyền lợi hội viên</p>
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
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-slate-900">Đã gửi yêu cầu thành công!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Yêu cầu đã chuyển sang trạng thái PENDING để Center Manager / Lễ tân phê duyệt. 
                Học viên sẽ được hoàn 100% lượt tập ngay sau khi duyệt.
              </p>
            </div>
          ) : (
            <>
              {errorMessage && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Target Session Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Ca dạy yêu cầu hủy:
                </span>
                <p className="text-sm font-bold text-slate-900">{sessionTitle}</p>
                <p className="text-xs text-emerald-700 font-semibold">{sessionTime}</p>
              </div>

              {/* Policy Note Alert */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Quy tắc nghiệp vụ Mục 6.5:</p>
                  <p className="text-[11px] leading-relaxed text-amber-800">
                    HLV không thể tự hủy trực tiếp. Yêu cầu sẽ tạo bản ghi chờ duyệt. 100% học viên bị ảnh hưởng sẽ được hệ thống hoàn đủ 01 lượt tập (không phụ thuộc mốc 2 giờ).
                  </p>
                </div>
              </div>

              {/* Reason Message Field (Apology for Member - Required >= 20 chars) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Lời nhắn gửi học viên (Bắt buộc tối thiểu 20 ký tự) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reasonMessage}
                  onChange={(e) => setReasonMessage(e.target.value)}
                  placeholder="Ví dụ: Rất xin lỗi quý học viên, HLV có sự cố sức khỏe đột xuất không thể đứng lớp ca này..."
                  rows={3}
                  className={`w-full rounded-xl border p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 resize-none transition-all ${
                    reasonMessage.length > 0 && !isReasonValid
                      ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                      : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
                <div className="flex items-center justify-between text-[11px] mt-1">
                  <span
                    className={
                      isReasonValid
                        ? 'text-emerald-600 font-semibold flex items-center gap-1'
                        : 'text-amber-600'
                    }
                  >
                    {isReasonValid
                      ? '✓ Đạt độ dài tối thiểu'
                      : `Cần thêm ít nhất ${Math.max(0, 20 - reasonMessage.trim().length)} ký tự nữa`}
                  </span>
                  <span className="text-slate-400">{reasonMessage.trim().length}/20 ký tự</span>
                </div>
              </div>

              {/* Internal Note for Center Manager */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ghi chú nội bộ cho Quản lý / Lễ tân (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder="Ví dụ: Đã báo lễ tân trực quầy hỗ trợ đổi lớp khác cho khách..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isSuccess && (
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={mutation.isPending}
              className="text-xs font-semibold"
            >
              Đóng
            </Button>
            <Button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!isReasonValid || mutation.isPending}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5 disabled:opacity-50"
            >
              {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Gửi đơn xin hủy khẩn cấp</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
