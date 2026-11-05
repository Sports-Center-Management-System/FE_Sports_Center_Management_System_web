import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dumbbell,
  Layers,
  Search,
  X,
  ArrowRight,
  BookOpen,
  ChevronRight,
  Calendar,
  Filter,
} from 'lucide-react';
import { WorkoutPlanDetailModal } from '@/components/common/workout-plan-detail-modal';
import { apiClient } from '@/services/api-client';
import { vietnamDate } from '@/lib/date';
import {
  parseExerciseInstructions,
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

  // My Plans Filters
  const [planSearch, setPlanSearch] = useState<string>('');
  const [planDateFilter, setPlanDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH'>('ALL');
  const [dateSort, setDateSort] = useState<'DESC' | 'ASC'>('DESC');

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

  // 2. Fetch coaches list to resolve coachId to Coach's actual Name
  const { data: coachesList = [] } = useQuery({
    queryKey: ['coaches', 'all-list'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/coaches');
        const data = res.data;
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
  });

  // 3. Fetch member profile to get assigned coach fallback from subscription
  const { data: memberProfile } = useQuery({
    queryKey: ['member', 'profile-subscription-coach'],
    queryFn: async () => {
      try {
        const res = await apiClient.get<any>('/users/me');
        return res.data;
      } catch {
        return null;
      }
    },
  });

  // 4. Fetch official 12-session template roadmaps
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

  // Cache of dynamically fetched coach names from /users/:id
  const [coachUserMap, setCoachUserMap] = useState<Record<string, string>>({});

  // Build high-performance lookup map of coaches
  const coachMap = useMemo(() => {
    const map = new Map<string, string>();
    coachesList.forEach((c: any) => {
      if (c.id && c.fullName) map.set(c.id, c.fullName);
      if (c.userId && c.fullName) map.set(c.userId, c.fullName);
      if (c.coachProfile?.id && c.fullName) map.set(c.coachProfile.id, c.fullName);
      if (c.coachProfile?.userId && c.fullName) map.set(c.coachProfile.userId, c.fullName);
    });
    return map;
  }, [coachesList]);

  // For any plan that has a coachId not yet found, fetch /users/:id
  useEffect(() => {
    rawPlans.forEach((plan) => {
      const cId = plan.coachId;
      if (!cId) return;
      const existingName = plan.coach?.fullName?.trim();
      if (
        existingName &&
        existingName !== 'Huấn luyện viên phụ trách' &&
        existingName !== 'HLV phụ trách' &&
        existingName !== 'HLV chỉ định'
      ) {
        return;
      }
      if (coachMap.has(cId) || coachUserMap[cId]) return;

      void apiClient
        .get<any>(`/users/${cId}`)
        .then((res) => {
          if (res.data?.fullName) {
            setCoachUserMap((prev) => ({ ...prev, [cId]: res.data.fullName }));
          }
        })
        .catch(() => {});
    });
  }, [rawPlans, coachMap, coachUserMap]);

  // Helper to reliably resolve the real Coach Name
  const resolveCoachName = (plan: MemberWorkoutPlanItem): string => {
    const directName = plan.coach?.fullName?.trim();
    if (
      directName &&
      directName !== 'Huấn luyện viên phụ trách' &&
      directName !== 'HLV phụ trách' &&
      directName !== 'HLV chỉ định'
    ) {
      return directName;
    }
    if (plan.coachId) {
      if (coachMap.has(plan.coachId)) return coachMap.get(plan.coachId)!;
      if (coachUserMap[plan.coachId]) return coachUserMap[plan.coachId];
    }
    const assignedCoach =
      memberProfile?.subscriptions?.find((s: any) => s.assignedCoach?.fullName)?.assignedCoach?.fullName ||
      memberProfile?.subscriptions?.[0]?.assignedCoach?.fullName;
    if (assignedCoach) {
      return assignedCoach;
    }
    return 'Huấn luyện viên PT';
  };

  // Filtered and Sorted assigned plans
  const filteredAndSortedPlans = useMemo(() => {
    let list = [...rawPlans];

    // 1. Search Query
    if (planSearch.trim()) {
      const q = planSearch.toLowerCase().trim();
      list = list.filter((p) => {
        const cName = resolveCoachName(p).toLowerCase();
        const titleMatch = p.title?.toLowerCase().includes(q);
        const notesMatch = p.notes?.toLowerCase().includes(q);
        const coachMatch = cName.includes(q);
        const exerciseMatch = p.exercises?.some(
          (ex) =>
            ex.exercise?.title?.toLowerCase().includes(q) ||
            ex.exercise?.category?.toLowerCase().includes(q)
        );
        return titleMatch || notesMatch || coachMatch || exerciseMatch;
      });
    }

    // 2. Date Filter
    const now = new Date();
    if (planDateFilter === 'THIS_MONTH') {
      const curMonth = now.getMonth();
      const curYear = now.getFullYear();
      list = list.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === curMonth && d.getFullYear() === curYear;
      });
    } else if (planDateFilter === 'LAST_MONTH') {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lm = lastMonthDate.getMonth();
      const ly = lastMonthDate.getFullYear();
      list = list.filter((p) => {
        const d = new Date(p.createdAt);
        return d.getMonth() === lm && d.getFullYear() === ly;
      });
    }

    // 3. Sort by Date
    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return dateSort === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return list;
  }, [rawPlans, planSearch, planDateFilter, dateSort, coachMap, coachUserMap, memberProfile]);

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
    const isModalOpen = Boolean(selectedPlan || selectedTemplate);
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
    <div className="space-y-6 pb-16">
      {/* ========================================================= */}
      {/* PAGE HEADER                                               */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-[2rem] border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Dumbbell className="w-5 h-5" />
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Training Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Giáo Án & Lộ Trình Tập Luyện
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Theo dõi khối lượng tập luyện, số hiệp, mức tạ và lời dặn cá nhân hóa từ Huấn luyện viên
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="relative z-10 inline-flex p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 self-start md:self-auto backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveTab('MY_PLANS')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'MY_PLANS'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Giáo án của tôi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'MY_PLANS'
                  ? 'bg-slate-950 text-emerald-300'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {rawPlans.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TEMPLATES')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'TEMPLATES'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lộ trình 12 buổi mẫu</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'TEMPLATES'
                  ? 'bg-slate-950 text-emerald-300'
                  : 'bg-slate-800 text-slate-300'
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
        <div className="space-y-5">
          {/* Enhanced Search & Filter Dock */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={planSearch}
                  onChange={(e) => setPlanSearch(e.target.value)}
                  placeholder="Tìm theo tên HLV, tiêu đề, bài tập..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/90 pl-10 pr-9 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/15 transition-all"
                />
                {planSearch && (
                  <button
                    type="button"
                    onClick={() => setPlanSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <span className="text-xs font-bold text-slate-500">Sắp xếp:</span>
                <select
                  value={dateSort}
                  onChange={(e) => setDateSort(e.target.value as 'DESC' | 'ASC')}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
                >
                  <option value="DESC">Mới nhất (Ngày tạo)</option>
                  <option value="ASC">Cũ nhất (Ngày tạo)</option>
                </select>
              </div>
            </div>

            {/* Quick Date Chips */}
            <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-extrabold text-slate-400 mr-1 flex items-center gap-1 uppercase tracking-wider">
                  <Filter className="w-3 h-3" /> Lọc ngày:
                </span>
                {(
                  [
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'THIS_MONTH', label: 'Tháng này' },
                    { key: 'LAST_MONTH', label: 'Tháng trước' },
                  ] as const
                ).map((chip) => {
                  const active = planDateFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setPlanDateFilter(chip.key)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>

              <span className="text-xs font-semibold text-slate-400">
                Hiển thị <strong className="text-slate-800">{filteredAndSortedPlans.length}</strong> giáo án
              </span>
            </div>
          </div>

          {/* Cards or Empty State */}
          {isLoadingPlans ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 animate-pulse space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-slate-200 rounded-lg" />
                    <div className="h-4 w-16 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-100 rounded-md" />
                    <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedPlans.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-14 text-center rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-slate-900">
                  {rawPlans.length === 0
                    ? 'Chưa có giáo án riêng từ Huấn luyện viên'
                    : 'Không tìm thấy giáo án phù hợp với bộ lọc'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  {rawPlans.length === 0
                    ? 'Khi bạn hoàn thành ca tập PT 1-1 hoặc được huấn luyện viên chỉ định bài tập, giáo án và lời dặn chi tiết sẽ tự động xuất hiện tại đây.'
                    : 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang mốc thời gian "Tất cả".'}
                </p>
              </div>

              {rawPlans.length === 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('TEMPLATES')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#008b74] hover:bg-[#007360] text-white text-xs font-bold transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Khám phá lộ trình 12 buổi chuẩn</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Modern Athletic Bento Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedPlans.map((plan) => {
                const totalExercises = plan.exercises?.length || 0;
                const coachName = resolveCoachName(plan);
                const tagLabel = plan.template?.disciplineCode || 'Giáo án cá nhân 1-1';

                return (
                  <article
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className="group relative p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-3.5">
                      {/* Top Badges & Date */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[10px] font-black uppercase tracking-wider">
                          {tagLabel}
                        </span>

                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {vietnamDate(plan.createdAt)}
                        </span>
                      </div>

                      {/* Coach info bar: CLEARLY DISPLAYS ACTUAL COACH'S FULL NAME */}
                      <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-emerald-50/40 border border-slate-200/70">
                        <div className="w-8 h-8 rounded-full bg-[#008b74] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs ring-2 ring-emerald-500/20">
                          {coachName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase tracking-wider">
                            Huấn luyện viên phụ trách
                          </span>
                          <p className="text-xs font-black text-slate-900 truncate">
                            {coachName}
                          </p>
                        </div>
                      </div>

                      {/* Title & Notes */}
                      <div>
                        <h3 className="text-base font-black text-slate-900 group-hover:text-[#008b74] transition-colors leading-snug">
                          {plan.title}
                        </h3>
                        {plan.notes && (
                          <div className="mt-2 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 line-clamp-2 italic font-medium">
                            🎯 "{plan.notes}"
                          </div>
                        )}
                      </div>

                      {/* Exercise Previews */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px] font-black text-slate-400 pb-0.5 uppercase tracking-wider">
                          <span>Nội dung bài tập</span>
                          <span className="text-[#008b74]">{totalExercises} bài</span>
                        </div>

                        {plan.exercises?.slice(0, 3).map((ex, idx) => {
                          const meta = parseExerciseInstructions(ex.exercise?.instructions);
                          const { primary } = parseExerciseTitle(ex.exercise?.title);
                          const unitStr = meta.unitVi || 'lần';

                          return (
                            <div
                              key={ex.id || idx}
                              className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-200/60 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-lg bg-white text-slate-600 text-[10px] font-black flex items-center justify-center shrink-0 border border-slate-200">
                                  {idx + 1}
                                </span>
                                <span className="font-bold text-slate-800 truncate">
                                  {primary}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-black">
                                <span className="text-[#008b74]">
                                  {ex.sets || 3}h
                                </span>
                                <span className="text-slate-400">×</span>
                                <span className="text-slate-600">
                                  {ex.reps || 10} {unitStr}
                                </span>
                                {ex.weightKg !== null && ex.weightKg !== undefined && Number(ex.weightKg) > 0 && (
                                  <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200 text-[10px]">
                                    {ex.weightKg}kg
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {totalExercises > 3 && (
                          <p className="text-[11px] font-bold text-slate-400 pt-0.5 text-center">
                            + {totalExercises - 3} bài tập chi tiết khác
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-black text-[#008b74] group-hover:underline flex items-center gap-1">
                        Xem chi tiết giáo án
                        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Discipline Switcher */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('BOXING')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    templateDiscipline === 'BOXING'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <span>🥊</span>
                  <span>Boxing (Lộ trình 12 buổi)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('YOGA')}
                  className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    templateDiscipline === 'YOGA'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <span>🧘</span>
                  <span>Yoga (Lộ trình 12 buổi)</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Tìm kiếm bài tập trong giáo trình..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Week Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 border-t border-slate-100 pb-1">
              <span className="text-[11px] font-black text-slate-400 mr-1 shrink-0 uppercase tracking-wider">
                Tuần học:
              </span>
              {(['ALL', '1', '2', '3', '4'] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setTemplateWeekFilter(w)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    templateWeekFilter === w
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {w === 'ALL' ? 'Tất cả 4 tuần' : `Tuần ${w}`}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {isLoadingTemplates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-6 rounded-3xl bg-white border border-slate-200 animate-pulse space-y-4"
                >
                  <div className="h-5 w-24 bg-slate-200 rounded-lg" />
                  <div className="h-6 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredTemplates.map((tpl) => (
                <article
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className="group relative p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider">
                        {tpl.disciplineCode}
                      </span>
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        Tuần {tpl.weekNumber}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition-colors leading-snug">
                        {tpl.title}
                      </h4>
                      {tpl.description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                          {tpl.description}
                        </p>
                      )}
                    </div>

                    {/* Exercises Preview */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-black text-slate-400 pb-0.5 uppercase tracking-wider">
                        {tpl.exercises?.length || 0} bài tập chuẩn hóa
                      </div>

                      {tpl.exercises?.slice(0, 3).map((ex, idx) => (
                        <div
                          key={ex.id || idx}
                          className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="font-bold text-slate-700 truncate">
                            {ex.exercise?.title}
                          </span>
                          <span className="text-[11px] font-black text-emerald-700 shrink-0">
                            {ex.sets || 3} hiệp × {ex.reps || 10}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 group-hover:underline flex items-center gap-1">
                      Xem chi tiết đề cương
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
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
      <WorkoutPlanDetailModal
        isOpen={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        title={selectedPlan?.title}
        coachName={selectedPlan ? resolveCoachName(selectedPlan) : ''}
        notes={selectedPlan?.notes}
        exercises={selectedPlan?.exercises || []}
      />

      {/* ========================================================= */}
      {/* MODAL 2: CHI TIẾT BUỔI HỌC MẪU (TEMPLATE SESSION)          */}
      {/* ========================================================= */}
      <WorkoutPlanDetailModal
        isOpen={Boolean(selectedTemplate)}
        onClose={() => setSelectedTemplate(null)}
        title={selectedTemplate ? `Tuần ${selectedTemplate.weekNumber}: ${selectedTemplate.title}` : ''}
        coachName={`Giáo án chuẩn ${selectedTemplate?.disciplineCode || 'GYM'}`}
        notes={selectedTemplate?.description}
        exercises={selectedTemplate?.exercises || []}
      />
    </div>
  );
};

export default WorkoutPlansPage;
