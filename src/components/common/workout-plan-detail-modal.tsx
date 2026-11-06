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
        className="w-full max-w-lg sm:max-w-xl max-h-[90vh] rounded-[2rem] bg-white shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header: Clean light header with emerald dumbbell badge matching user design */}
        <div className="flex items-start justify-between p-6 pb-4 sm:p-7 sm:pb-5 bg-white shrink-0 border-b border-slate-100">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900 leading-tight truncate">
                {title || 'giáo án buổi tập'}
              </h3>
              <p className="text-xs text-slate-500 font-medium truncate mt-1">
                {coachName || 'Huấn luyện viên phụ trách'} · {exercises.length} bài tập
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0 ml-3"
            title="Đóng modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: Scrollable exercise list */}
        <div className="p-6 pt-4 sm:p-7 sm:pt-5 overflow-y-auto space-y-4 flex-1 bg-white">
          {/* Coach Notes */}
          {notes && (
            <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-1">
              <div className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                Lời dặn của HLV:
              </div>
              <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                {notes}
              </p>
            </div>
          )}

          {/* Exercise Section */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
              DANH SÁCH BÀI TẬP ({exercises.length})
            </h4>

            {exercises.length === 0 ? (
              <div className="p-8 text-center text-xs font-medium text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                Chưa có bài tập nào trong giáo án này
              </div>
            ) : (
              <div className="space-y-3">
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
                      className="p-4 sm:p-4.5 rounded-2xl border border-slate-200/80 bg-white shadow-2xs flex items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                    >
                      {/* Left: Number circle + Exercise Name */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <span className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <h5 className="text-sm sm:text-base font-bold text-slate-900 leading-snug truncate">
                            {rawTitle}
                          </h5>
                          {ex.coachFeedback && (
                            <p className="text-xs font-medium text-slate-500 italic truncate mt-0.5">
                              {ex.coachFeedback}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Specs (Sets x Reps, Weight & Rest) */}
                      <div className="text-right shrink-0">
                        <div className="text-sm sm:text-base font-bold text-slate-900">
                          {sets} hiệp × {reps} reps
                        </div>
                        <div className="text-xs font-medium text-slate-400 mt-0.5">
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

        {/* Footer: Bottom Right Deep Black Rounded Button */}
        <div className="p-6 pt-2 sm:p-7 sm:pt-2 bg-white flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white text-xs sm:text-sm font-black shadow-md transition active:scale-[0.98] cursor-pointer"
          >
            Đóng giáo án
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
};

