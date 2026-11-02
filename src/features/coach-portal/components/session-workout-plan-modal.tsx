import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Save,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type {
  BookingWorkoutExercise,
  StudentBookingItem,
} from '../types/coach-portal.types';
import { parseExerciseInstructions } from '../utils/exercise-metadata.utils';

interface SessionWorkoutPlanModalProps {
  booking: StudentBookingItem;
  sessionTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SessionWorkoutPlanModal: React.FC<SessionWorkoutPlanModalProps> = ({
  booking,
  sessionTitle,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [exercises, setExercises] = useState<BookingWorkoutExercise[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    data: plan,
    isLoading,
  } = useQuery({
    queryKey: ['coach', 'booking-workout-plan', booking.id],
    queryFn: () => coachPortalApi.getWorkoutPlanByBooking(booking.id),
    enabled: isOpen,
  });

  useEffect(() => {
    if (plan) {
      setExercises(plan.exercises || []);
      setNotes(plan.notes || '');
    } else {
      setExercises([]);
      setNotes('');
    }
  }, [plan]);

  const updateExerciseField = (
    index: number,
    field: keyof BookingWorkoutExercise,
    value: any
  ) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!plan?.id) {
        throw new Error('Chưa tìm thấy bản ghi giáo án cho ca tập này.');
      }
      return coachPortalApi.updateSessionWorkoutPlan(plan.id, {
        notes: notes.trim() || undefined,
        exercises: exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          sets: ex.sets ? Number(ex.sets) : undefined,
          reps: ex.reps ? Number(ex.reps) : undefined,
          weightKg: ex.weightKg !== null && ex.weightKg !== undefined ? Number(ex.weightKg) : null,
          restSeconds: ex.restSeconds ? Number(ex.restSeconds) : undefined,
          coachFeedback: ex.coachFeedback?.trim() || undefined,
        })),
      });
    },
    onSuccess: async () => {
      setSuccessMessage('Đã lưu cập nhật giáo án và nhận xét buổi tập thành công!');
      setErrorMessage(null);
      await queryClient.invalidateQueries({
        queryKey: ['coach', 'booking-workout-plan', booking.id],
      });
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu giáo án.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  if (!isOpen) return null;

  const memberName =
    booking.member?.fullName ||
    (booking.memberId ? `Học viên #${booking.memberId.slice(0, 8)}` : 'Học viên PT');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saveMutation.isPending) onClose();
      }}
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 bg-slate-50">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-black">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  {plan?.title || 'Giáo Án Buổi Tập PT 1-1'}
                </h3>
                {plan?.sessionOrder && (
                  <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5">
                    Buổi {plan.sessionOrder}/12
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ca dạy: {sessionTitle} • Học viên: <strong className="text-slate-800">{memberName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            disabled={saveMutation.isPending}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải giáo án buổi tập...</p>
            </div>
          ) : !plan ? (
            <div className="py-12 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
              <Dumbbell className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">
                Buổi tập tự do / cardio nhẹ
              </h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Buổi tập này không thuộc khung 12 buổi mẫu tự động (hoặc là ca phát sinh ngoài gói mẫu). HLV có thể hướng dẫn trực tiếp hoặc tùy biến bài tập tại phòng tập.
              </p>
            </div>
          ) : (
            <>
              {/* Plan Overview & Notes */}
              <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                    Lời dặn & Mục tiêu buổi học:
                  </span>
                  <span className="text-[11px] font-bold text-emerald-700">
                    {exercises.length} động tác bài tập
                  </span>
                </div>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú tổng thể cho học viên trong buổi tập này..."
                  className="w-full rounded-xl border border-emerald-200 bg-white p-2.5 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Exercises List (M14.1 Customization) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    Danh Sách Động Tác & Điều Chỉnh Của HLV (M14.1)
                  </h4>
                  <span className="text-[11px] text-slate-400 italic">
                    * HLV có thể chỉnh mức tạ, số hiệp và ghi nhận xét kỹ thuật
                  </span>
                </div>

                <div className="space-y-3">
                  {exercises.map((item, idx) => {
                    const meta = parseExerciseInstructions(item.exercise?.instructions);
                    return (
                      <div
                        key={item.id || idx}
                        className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3 transition-all hover:border-slate-300"
                      >
                        {/* Exercise Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white font-mono text-xs font-black">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-black text-slate-900">
                              {item.exercise?.title || `Bài tập #${idx + 1}`}
                            </span>
                            {meta.code && (
                              <span className="rounded bg-slate-100 text-slate-500 font-mono text-[10px] px-1.5 py-0.5">
                                {meta.code}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {meta.muscleVi && (
                              <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                {meta.muscleVi}
                              </span>
                            )}
                            {item.exercise?.category && (
                              <span className="rounded-md bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 text-[10px] font-bold uppercase self-start sm:self-auto">
                                {item.exercise.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {meta.instructionsText && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 italic">
                            <strong className="text-slate-700 not-italic">Kỹ thuật chuẩn:</strong> {meta.instructionsText}
                          </p>
                        )}

                      {/* Reps, Sets, Weight, Rest Inputs */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Số hiệp (Sets)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={item.sets ?? ''}
                            onChange={(e) =>
                              updateExerciseField(idx, 'sets', e.target.value)
                            }
                            placeholder="Số hiệp"
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Lặp / Giây (Reps)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={1000}
                            value={item.reps ?? ''}
                            onChange={(e) =>
                              updateExerciseField(idx, 'reps', e.target.value)
                            }
                            placeholder="Số lần"
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Mức tạ (kg)
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            min={0}
                            max={500}
                            value={item.weightKg ?? ''}
                            onChange={(e) =>
                              updateExerciseField(idx, 'weightKg', e.target.value)
                            }
                            placeholder="Tạ (kg)"
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 mb-1">
                            Nghỉ (giây)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={600}
                            value={item.restSeconds ?? ''}
                            onChange={(e) =>
                              updateExerciseField(idx, 'restSeconds', e.target.value)
                            }
                            placeholder="Giây"
                            className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Coach Feedback for this exercise */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3 text-slate-400" />
                          Nhận xét & Feedback của HLV (coachFeedback)
                        </label>
                        <input
                          type="text"
                          value={item.coachFeedback || ''}
                          maxLength={1000}
                          onChange={(e) =>
                            updateExerciseField(idx, 'coachFeedback', e.target.value)
                          }
                          placeholder="VD: Đòn Cross đã có lực xoay hông chuẩn, chú ý thở đều khi ra đòn..."
                          className="w-full rounded-xl border border-slate-200 p-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saveMutation.isPending}
            className="text-xs font-semibold"
          >
            Đóng
          </Button>
          {plan && (
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>{saveMutation.isPending ? 'Đang lưu...' : 'Lưu giáo án & Nhận xét'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
