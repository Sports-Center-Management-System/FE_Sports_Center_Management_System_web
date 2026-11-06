import React from 'react';
import { createPortal } from 'react-dom';
import { Dumbbell, X } from 'lucide-react';

export interface WorkoutPlanExerciseData {
  id?: string;
  title?: string;
  exercise?: {
    id?: string;
    title?: string;
    category?: string;
    instructions?: string;
  };
  sets?: number | null;
  reps?: number | null;
  weightKg?: number | string | null;
  restSeconds?: number | null;
  coachFeedback?: string | null;
}

export interface WorkoutPlanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  coachName?: string;
  notes?: string | null;
  exercises?: WorkoutPlanExerciseData[];
}

export const WorkoutPlanDetailModal: React.FC<WorkoutPlanDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  coachName,
  notes,
  exercises = [],
}) => {
  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg sm:max-w-xl max-h-[90vh] rounded-[2rem] bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header: Sleek dark styling with emerald dumbbell badge */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950 text-white">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-sm font-black">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-black text-white leading-tight truncate">
                {title || 'Giáo án buổi tập'}
              </h3>
              <p className="text-xs text-slate-300 font-medium truncate mt-0.5">
                {coachName || 'Huấn luyện viên phụ trách'} · {exercises.length} bài tập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Đóng modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: Scrollable exercise list */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
          {/* Coach Notes */}
          {notes && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
              <div className="text-xs font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                Lời dặn của HLV:
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                {notes}
              </p>
            </div>
          )}

          {/* Exercise Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              DANH SÁCH BÀI TẬP ({exercises.length})
            </h4>

            {exercises.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Chưa có bài tập nào trong giáo án này
              </div>
            ) : (
              <div className="space-y-2.5">
                {exercises.map((ex, idx) => {
                  const rawTitle = ex.exercise?.title || ex.title || 'Bài tập';
                  const sets = ex.sets || 3;
                  const reps = ex.reps || 10;
                  const weightKg = ex.weightKg;
                  const restSeconds = ex.restSeconds || 60;
                  const weightDisplay =
                    weightKg !== null && weightKg !== undefined && Number(weightKg) > 0
                      ? `${weightKg} kg`
                      : 'Bodyweight';

                  return (
                    <div
                      key={ex.id || idx}
                      className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                    >
                      {/* Left: Number circle + Exercise Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/60">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {rawTitle}
                          </h5>
                          {ex.coachFeedback && (
                            <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400 italic truncate mt-0.5">
                              💡 {ex.coachFeedback}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Specs (Sets x Reps, Weight & Rest) */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sets} hiệp × {reps} reps
                        </div>
                        <div className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                          {weightDisplay} · Nghỉ {restSeconds}s
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer: Bottom Right Dark Button */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-black shadow-sm transition active:scale-[0.98] cursor-pointer"
          >
            Đóng giáo án
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

