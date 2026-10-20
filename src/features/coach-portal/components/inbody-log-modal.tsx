import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';

interface InbodyLogModalProps {
  memberId: string;
  memberName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const InbodyLogModal: React.FC<InbodyLogModalProps> = ({
  memberId,
  memberName,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();

  const [weightKg, setWeightKg] = useState<string>('');
  const [muscleMassKg, setMuscleMassKg] = useState<string>('');
  const [bodyFatKg, setBodyFatKg] = useState<string>('');
  const [score, setScore] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const parsedWeight = parseFloat(weightKg);
      if (isNaN(parsedWeight) || parsedWeight <= 0) {
        throw new Error('Vui lòng nhập số cân nặng hợp lệ (lớn hơn 0).');
      }

      return coachPortalApi.createInbodyLog({
        memberId,
        weightKg: parsedWeight,
        muscleMassKg: muscleMassKg ? parseFloat(muscleMassKg) : undefined,
        bodyFatKg: bodyFatKg ? parseFloat(bodyFatKg) : undefined,
        score: score ? parseInt(score, 10) : undefined,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['coach', 'members'] }),
        queryClient.invalidateQueries({ queryKey: ['coach', 'inbody-progress', memberId] }),
      ]);
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu chỉ số InBody';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-teal-600 text-white flex items-center justify-center">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Nhập Chỉ Số InBody</h3>
              <p className="text-xs text-slate-500">Học viên: {memberName}</p>
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
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cân nặng (kg) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 68.5"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lượng cơ (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 32.4"
                value={muscleMassKg}
                onChange={(e) => setMuscleMassKg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lượng mỡ (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="VD: 14.2"
                value={bodyFatKg}
                onChange={(e) => setBodyFatKg(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Điểm InBody (1-100)
              </label>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="VD: 78"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ghi chú đánh giá thể trạng
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú về phân bố mỡ, khuyến nghị dinh dưỡng hoặc mục tiêu đợt đo tiếp theo..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 resize-none"
            />
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
            Hủy
          </Button>
          <Button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!weightKg || mutation.isPending}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold gap-1.5 disabled:opacity-50"
          >
            {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <span>Lưu chỉ số InBody</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
