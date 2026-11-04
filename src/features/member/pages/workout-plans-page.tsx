import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dumbbell,
  Layers,
  Search,
  X,
  MessageSquare,
  ArrowRight,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { vietnamDate } from '@/lib/date';
import {
  parseExerciseInstructions,
  translateCategory,
  parseExerciseTitle,
} from '@/features/coach-portal/utils/exercise-metadata.utils';

/* =========================================================
   TYPES
========================================================= */

export interface WorkoutExerciseItem {
  id?: string;
  exerciseId: string;
  sets?: number | null;
  reps?: number | null;
  weightKg?: number | string | null;
  restSeconds?: number | null;
  coachFeedback?: string | null;
  orderIndex?: number;
  exercise?: {
    id: string;
    title: string;
    category: string;
    instructions?: string;
  };
}

export interface MemberWorkoutPlanItem {
  id: string;
  memberId: string;
  coachId: string;
  bookingId?: string | null;
  templateId?: string | null;
  sessionOrder?: number | null;
  title: string;
  notes?: string | null;
  createdAt: string;
  coach?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  };
  template?: {
    id: string;
    templateCode: string;
    disciplineCode: string;
    title: string;
    weekNumber: number;
    sessionOrder: number;
    description?: string | null;
  };
  exercises: WorkoutExerciseItem[];
}

export interface WorkoutTemplateSession {
  id: string;
  templateCode: string;
  disciplineCode: string;
  title: string;
  weekNumber: number;
  sessionOrder: number;
  description?: string;
  exercises: Array<{
    id: string;
    exerciseId: string;
    sets?: number;
    reps?: number;
    weightKg?: number | null;
    restSeconds?: number;
    orderIndex: number;
    exercise: {
      id: string;
      title: string;
      category: string;
      instructions?: string;
    };
  }>;
}

type TabType = 'MY_PLANS' | 'TEMPLATES';

/* =========================================================
   PAGE COMPONENT
========================================================= */

export const WorkoutPlansPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('MY_PLANS');
  const [selectedPlan, setSelectedPlan] = useState<MemberWorkoutPlanItem | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplateSession | null>(null);

  // Template Tab state
  const [templateDiscipline, setTemplateDiscipline] = useState<'BOXING' | 'YOGA'>('BOXING');
  const [templateWeekFilter, setTemplateWeekFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');

  // 1. Fetch member's real assigned workout plans
  const {
    data: rawPlans = [],
    isLoading: isLoadingPlans,
  } = useQuery({
    queryKey: ['member', 'workout-plans'],
    queryFn: async (): Promise<MemberWorkoutPlanItem[]> => {
      const res = await apiClient.get<any>('/workout-plans');
      const data = res.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // 2. Fetch official 12-session template roadmaps
  const {
    data: rawTemplates = [],
    isLoading: isLoadingTemplates,
  } = useQuery({
    queryKey: ['member', 'workout-templates', templateDiscipline],
    queryFn: async (): Promise<WorkoutTemplateSession[]> => {
      const res = await apiClient.get<any>('/workout-templates', {
        params: { discipline: templateDiscipline },
      });
      const data = res.data;
      return Array.isArray(data) ? data : [];
    },
  });

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return rawTemplates.filter((item) => {
      if (templateWeekFilter !== 'ALL' && String(item.weekNumber) !== templateWeekFilter) {
        return false;
      }
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase().trim();
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesExercise = item.exercises?.some((ex) =>
          ex.exercise?.title?.toLowerCase().includes(q)
        );
        return matchesTitle || matchesDesc || matchesExercise;
      }
      return true;
    });
  }, [rawTemplates, templateWeekFilter, templateSearch]);

  // Lock background scroll when any modal opens
  useEffect(() => {
    const isModalOpen = !!selectedPlan || !!selectedTemplate;
    if (!isModalOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedPlan, selectedTemplate]);

  // Close modal with ESC
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPlan(null);
        setSelectedTemplate(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Giáo Án & Lộ Trình Tập Luyện
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Theo dõi danh mục bài tập, mức tạ, số hiệp và lời dặn cá nhân hóa từ Huấn luyện viên
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shrink-0 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('MY_PLANS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'MY_PLANS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Giáo án của tôi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'MY_PLANS'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {rawPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'TEMPLATES'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lộ trình 12 buổi mẫu</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'TEMPLATES'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {rawTemplates.length || 12}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GIÁO ÁN CỦA TÔI (MY ASSIGNED WORKOUT PLANS)        */}
      {/* ========================================================= */}
      {activeTab === 'MY_PLANS' && (
        <div className="space-y-4">
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md" />
                    <div className="h-4 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : rawPlans.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-100 dark:border-emerald-900/50 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  Chưa có giáo án riêng từ Huấn luyện viên
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Khi bạn đặt ca tập PT 1-1 hoặc được huấn luyện viên chỉ định bài tập, giáo án và lời dặn chi tiết của từng buổi sẽ tự động xuất hiện tại đây.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('TEMPLATES')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Khám phá lộ trình 12 buổi chuẩn</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rawPlans.map((plan) => {
                const totalExercises = plan.exercises?.length || 0;
                const coachName = plan.coach?.fullName || 'Huấn luyện viên';
                const sessionLabel = plan.sessionOrder
                  ? `Buổi ${plan.sessionOrder}/12`
                  : 'Giáo án cá nhân';

                return (
                  <article
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className="group relative p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-emerald-300 dark:hover:border-emerald-700/80 transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Top Badges & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                            {sessionLabel}
                          </span>
                          {plan.template?.disciplineCode && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[10px] font-bold uppercase">
                              {plan.template.disciplineCode}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          {vietnamDate(plan.createdAt)}
                        </span>
                      </div>

                      {/* Coach info bar */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black flex items-center justify-center shrink-0 border border-emerald-200/60">
                          {coachName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate">
                          HLV: <strong className="text-slate-900 dark:text-slate-100">{coachName}</strong>
                        </span>
                      </div>

                      {/* Title & Notes */}
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                          {plan.title}
                        </h3>
                        {plan.notes && (
                          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                            "{plan.notes}"
                          </p>
                        )}
                      </div>

                      {/* Exercise Previews */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 pb-0.5">
                          <span>Nội dung bài tập ({totalExercises})</span>
                        </div>

                        {plan.exercises?.slice(0, 3).map((ex, idx) => {
                          const meta = parseExerciseInstructions(ex.exercise?.instructions);
                          const { primary } = parseExerciseTitle(ex.exercise?.title);
                          const unitStr = meta.unitVi || 'lần';

                          return (
                            <div
                              key={ex.id || idx}
                              className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex items-center gap-1.5">
                                <span className="w-4 h-4 rounded-full bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-[9px] font-bold flex items-center justify-center shrink-0 border border-slate-200/60">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                                  {primary}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 text-[10.5px] font-bold text-slate-500 dark:text-slate-400">
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  {ex.sets || 3}h
                                </span>
                                <span>×</span>
                                <span>
                                  {ex.reps || 10} {unitStr}
                                </span>
                                {ex.weightKg !== null && ex.weightKg !== undefined && Number(ex.weightKg) > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                                    {ex.weightKg}kg
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {totalExercises > 3 && (
                          <p className="text-[10px] font-semibold text-slate-400 pt-0.5">
                            + {totalExercises - 3} bài tập khác trong buổi
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
                        Xem chi tiết giáo án
                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LỘ TRÌNH 12 BUỔI MẪU (BOXING / YOGA)               */}
      {/* ========================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Discipline Switcher: Chỉ Boxing & Yoga */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('BOXING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    templateDiscipline === 'BOXING'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-rose-700 hover:bg-rose-50 border border-rose-200/70'
                  }`}
                >
                  Boxing (12 buổi)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('YOGA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    templateDiscipline === 'YOGA'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-indigo-700 hover:bg-indigo-50 border border-indigo-200/70'
                  }`}
                >
                  Yoga (12 buổi)
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Tìm kiếm bài tập, kỹ thuật trong giáo trình..."
                  className="w-full rounded-xl border border-slate-200/80 bg-white/90 dark:bg-slate-800 pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Week Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100/80 dark:border-slate-800 pb-1">
              <span className="text-[11px] font-bold text-slate-400 mr-1 shrink-0">
                Tuần học:
              </span>
              {(['ALL', '1', '2', '3', '4'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTemplateWeekFilter(w)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    templateWeekFilter === w
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 border border-slate-200/50'
                  }`}
                >
                  {w === 'ALL' ? 'Tất cả 4 tuần' : `Tuần ${w}`}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((tpl) => (
                <article
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className="group relative p-5 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800 text-[10px] font-black uppercase tracking-wider">
                        Buổi {tpl.sessionOrder}/12
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        Tuần {tpl.weekNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors leading-snug">
                        {tpl.title}
                      </h4>
                      {tpl.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    {/* Exercises Preview */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-bold text-slate-400 pb-0.5">
                        {tpl.exercises?.length || 0} bài tập chuẩn
                      </div>

                      {tpl.exercises?.slice(0, 3).map((ex, idx) => (
                        <div
                          key={ex.id || idx}
                          className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {ex.exercise?.title}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            {ex.sets || 3} hiệp × {ex.reps || 10}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-1">
                      Xem chi tiết đề cương
                      <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: CHI TIẾT GIÁO ÁN HỌC VIÊN                        */}
      {/* ========================================================= */}
      {selectedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedPlan(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-slate-200/80 dark:border-slate-800 p-6 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-black uppercase">
                      {selectedPlan.sessionOrder ? `Buổi ${selectedPlan.sessionOrder}/12` : 'Giáo án cá nhân'}
                    </span>
                    {selectedPlan.template?.weekNumber && (
                      <span className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
                        Tuần {selectedPlan.template.weekNumber}
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-400">
                      Lập ngày: {vietnamDate(selectedPlan.createdAt)}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {selectedPlan.title}
                  </h2>

                  {/* Coach attribution */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                      {(selectedPlan.coach?.fullName || 'H').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300">
                      Huấn luyện viên phụ trách:{' '}
                      <strong className="text-slate-900 dark:text-slate-100">
                        {selectedPlan.coach?.fullName || 'HLV chỉ định'}
                      </strong>
                    </span>
                  </div>

                  {selectedPlan.notes && (
                    <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 italic">
                      🎯 <strong>Mục tiêu buổi tập:</strong> "{selectedPlan.notes}"
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-2xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
                <span>Danh sách động tác ({selectedPlan.exercises?.length || 0})</span>
              </div>

              {selectedPlan.exercises?.map((ex, idx) => {
                const meta = parseExerciseInstructions(ex.exercise?.instructions);
                const { primary, secondary } = parseExerciseTitle(ex.exercise?.title);
                const unitStr = meta.unitVi || 'lần';

                return (
                  <div
                    key={ex.id || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {primary}
                          </h4>
                          {secondary && (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {secondary}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {translateCategory(ex.exercise?.category)}
                      </span>
                    </div>

                    {/* Metrics Pills */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800">
                        {ex.sets || 3} hiệp
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60">
                        {ex.reps || 10} {unitStr}
                      </span>
                      {ex.weightKg !== null && ex.weightKg !== undefined && Number(ex.weightKg) > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60">
                          Tạ: {ex.weightKg} kg
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        ⏱ Nghỉ {ex.restSeconds || 60}s
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                        🎯 {meta.muscleVi}
                      </span>
                    </div>

                    {/* Coach Feedback Box */}
                    {ex.coachFeedback && (
                      <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                        <div className="font-black flex items-center gap-1.5 text-emerald-800 dark:text-emerald-200">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Lời dặn của Huấn luyện viên:</span>
                        </div>
                        <p className="leading-relaxed pl-5 font-medium">
                          {ex.coachFeedback}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: CHI TIẾT BUỔI HỌC MẪU (TEMPLATE SESSION)          */}
      {/* ========================================================= */}
      {selectedTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedTemplate(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-slate-200/80 dark:border-slate-800 p-6 bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1 text-xs font-black uppercase">
                      Buổi {selectedTemplate.sessionOrder}/12
                    </span>
                    <span className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 text-xs font-bold border border-slate-200 dark:border-slate-700">
                      Tuần {selectedTemplate.weekNumber}
                    </span>
                    <span className="rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-xs font-bold uppercase">
                      {selectedTemplate.disciplineCode}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {selectedTemplate.title}
                  </h2>

                  {selectedTemplate.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {selectedTemplate.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="rounded-2xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-1">
                Danh sách bài tập ({selectedTemplate.exercises?.length || 0})
              </div>

              {selectedTemplate.exercises?.map((ex, idx) => {
                const meta = parseExerciseInstructions(ex.exercise?.instructions);
                const { primary, secondary } = parseExerciseTitle(ex.exercise?.title);
                const unitStr = meta.unitVi || 'lần';

                return (
                  <div
                    key={ex.id || idx}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-mono text-xs font-black flex items-center justify-center shrink-0">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                            {primary}
                          </h4>
                          {secondary && (
                            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              {secondary}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                        {translateCategory(ex.exercise?.category)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60">
                        {ex.sets || 3} hiệp
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold border border-slate-200/60">
                        {ex.reps || 10} {unitStr}
                      </span>
                      {ex.weightKg !== null && ex.weightKg !== undefined && Number(ex.weightKg) > 0 && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/60">
                          Tạ: {ex.weightKg} kg
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        ⏱ Nghỉ {ex.restSeconds || 60}s
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 text-[11px]">
                        🎯 {meta.muscleVi}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutPlansPage;
