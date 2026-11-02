import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dumbbell,
  Plus,
  Trash2,
  BookOpen,
  Search,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Layers,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type { WorkoutExerciseDto } from '../types/coach-portal.types';

type PlanTab = 'TEMPLATES' | 'CUSTOM_PLANS' | 'EXERCISE_LIBRARY';

export const CoachWorkoutPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlanTab>('TEMPLATES');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // --- Tab 1: Templates (M14) ---
  const [templateDiscipline, setTemplateDiscipline] = useState<'ALL' | 'BOXING' | 'YOGA'>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // --- Tab 2: Custom Plans ---
  const [customPlanSearch, setCustomPlanSearch] = useState<string>('');

  // --- Tab 3: Exercise Library (M09) ---
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Form states for creating a new custom plan
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');
  const [exercisesList, setExercisesList] = useState<
    Array<WorkoutExerciseDto & { title?: string; category?: string }>
  >([]);
  const [formExerciseSearch, setFormExerciseSearch] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    isRefetching: isRefetchingTemplates,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['coach', 'workout-templates', templateDiscipline],
    queryFn: () =>
      coachPortalApi.getWorkoutTemplates(
        templateDiscipline === 'ALL' ? undefined : templateDiscipline
      ),
  });

  const {
    data: plans = [],
    isLoading: isLoadingPlans,
    isRefetching: isRefetchingPlans,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: ['coach', 'workout-plans'],
    queryFn: () => coachPortalApi.getWorkoutPlans(),
  });

  const {
    data: exercisesKnowledge = [],
    isLoading: isLoadingExercises,
    isRefetching: isRefetchingExercises,
    refetch: refetchExercises,
  } = useQuery({
    queryKey: ['coach', 'exercise-knowledge'],
    queryFn: () => coachPortalApi.getExerciseKnowledge(),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['coach', 'members'],
    queryFn: () => coachPortalApi.getAssignedMembers(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!targetMemberId) throw new Error('Vui lòng chọn học viên nhận giáo án.');
      if (!planTitle.trim()) throw new Error('Vui lòng nhập tiêu đề giáo án.');
      if (exercisesList.length === 0) throw new Error('Vui lòng thêm ít nhất một bài tập vào giáo án.');

      return coachPortalApi.createWorkoutPlan({
        memberId: targetMemberId,
        title: planTitle.trim(),
        notes: planNotes.trim() || undefined,
        exercises: exercisesList.map(({ exerciseId, sets, reps, weightKg, restSeconds, coachFeedback }) => ({
          exerciseId,
          sets: sets || 3,
          reps: reps || 10,
          weightKg: weightKg || 0,
          restSeconds: restSeconds || 60,
          coachFeedback: coachFeedback || undefined,
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'workout-plans'] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Lỗi khi tạo giáo án';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coachPortalApi.deleteWorkoutPlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'workout-plans'] });
    },
  });

  const resetForm = () => {
    setTargetMemberId('');
    setPlanTitle('');
    setPlanNotes('');
    setExercisesList([]);
    setFormError(null);
  };

  const handleAddExerciseToForm = (item: { id: string; title: string; category: string }) => {
    if (exercisesList.some((e) => e.exerciseId === item.id)) return;
    setExercisesList([
      ...exercisesList,
      {
        exerciseId: item.id,
        title: item.title,
        category: item.category,
        sets: 3,
        reps: 10,
        weightKg: 20,
        restSeconds: 60,
        coachFeedback: '',
      },
    ]);
  };

  const handleRemoveExerciseFromForm = (exerciseId: string) => {
    setExercisesList(exercisesList.filter((e) => e.exerciseId !== exerciseId));
  };

  const handleUpdateExerciseParam = (
    index: number,
    field: keyof WorkoutExerciseDto,
    value: any
  ) => {
    const updated = [...exercisesList];
    updated[index] = { ...updated[index], [field]: value };
    setExercisesList(updated);
  };

  // Filtered lists
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const q = templateSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        tpl.title.toLowerCase().includes(q) ||
        tpl.templateCode.toLowerCase().includes(q) ||
        (tpl.description && tpl.description.toLowerCase().includes(q)) ||
        tpl.exercises?.some((e) => e.exercise?.title?.toLowerCase().includes(q))
      );
    });
  }, [templates, templateSearch]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) =>
      p.title.toLowerCase().includes(customPlanSearch.toLowerCase())
    );
  }, [plans, customPlanSearch]);

  const exerciseCategories = useMemo(() => {
    const set = new Set<string>();
    exercisesKnowledge.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [exercisesKnowledge]);

  const filteredExercises = useMemo(() => {
    return exercisesKnowledge.filter((ex) => {
      const matchCategory = selectedCategory === 'ALL' || ex.category === selectedCategory;
      const q = exerciseSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        ex.title.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        (ex.instructions && ex.instructions.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [exercisesKnowledge, selectedCategory, exerciseSearch]);

  const isCurrentLoading =
    activeTab === 'TEMPLATES'
      ? isLoadingTemplates
      : activeTab === 'CUSTOM_PLANS'
      ? isLoadingPlans
      : isLoadingExercises;

  const isCurrentRefetching =
    activeTab === 'TEMPLATES'
      ? isRefetchingTemplates
      : activeTab === 'CUSTOM_PLANS'
      ? isRefetchingPlans
      : isRefetchingExercises;

  const handleRefetch = () => {
    if (activeTab === 'TEMPLATES') void refetchTemplates();
    else if (activeTab === 'CUSTOM_PLANS') void refetchPlans();
    else void refetchExercises();
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Layers className="h-6 w-6 text-emerald-400" />
            Giáo Án & Lộ Trình Tập Luyện
          </h1>
          <p className="text-xs text-white mt-0.5">
            Xem lộ trình 12 buổi mẫu (Boxing & Yoga), giáo án theo học viên và kho 84 bài tập chuẩn
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleRefetch}
            disabled={isCurrentLoading || isCurrentRefetching}
            className="text-xs font-bold border-slate-200 bg-white shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCurrentRefetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Plus className="h-4 w-4" />
            <span>Soạn giáo án mới</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Flame className="h-4 w-4" />
          <span>Lộ Trình 12 Buổi Mẫu (M14)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'TEMPLATES'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CUSTOM_PLANS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CUSTOM_PLANS'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Giáo Án Học Viên</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'CUSTOM_PLANS'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXERCISE_LIBRARY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EXERCISE_LIBRARY'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Kho Bài Tập Chuẩn (M09)</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
              activeTab === 'EXERCISE_LIBRARY'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {exercisesKnowledge.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LỘ TRÌNH 12 BUỔI MẪU (M14)                         */}
      {/* ========================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          {/* Controls: Discipline filter pills & search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
                Bộ môn:
              </span>
              <button
                type="button"
                onClick={() => setTemplateDiscipline('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  templateDiscipline === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả ({templates.length})
              </button>
              <button
                type="button"
                onClick={() => setTemplateDiscipline('BOXING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  templateDiscipline === 'BOXING'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
                }`}
              >
                🥊 Boxing (12 buổi)
              </button>
              <button
                type="button"
                onClick={() => setTemplateDiscipline('YOGA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  templateDiscipline === 'YOGA'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                🧘 Yoga (12 buổi)
              </button>
            </div>

            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={templateSearch}
                onChange={(e) => setTemplateSearch(e.target.value)}
                placeholder="Tìm buổi học, bài tập trong lộ trình 12 buổi..."
                className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* System explanation banner */}
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-xs text-emerald-950 flex items-start gap-3">
            <Info className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold">
                Quy trình tự động gắn giáo án (Document 3 / Architecture Layer 2):
              </p>
              <p className="text-emerald-800">
                Khi hội viên đặt ca PT 1-1, hệ thống tự động gắn đề cương bài tập mẫu (Buổi 1..12) vào lịch tập. HLV có thể xem và cập nhật trực tiếp mức tạ, số hiệp và ghi nhận xét trong ca dạy tại màn hình <strong>Lịch Dạy &amp; Điểm Danh</strong>.
              </p>
            </div>
          </div>

          {/* Loading */}
          {isLoadingTemplates && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải đề cương 12 buổi mẫu...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingTemplates && filteredTemplates.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy buổi mẫu phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Vui lòng thử lại với từ khóa tìm kiếm hoặc chọn bộ môn khác.
              </p>
            </div>
          )}

          {/* Templates Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTemplates.map((tpl) => {
              const isBoxing = tpl.disciplineCode?.toUpperCase() === 'BOXING';
              const isExpanded = expandedTemplateId === tpl.id;

              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                              isBoxing
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}
                          >
                            {tpl.disciplineCode}
                          </span>
                          <span className="rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black">
                            Tuần {tpl.weekNumber} • Buổi {tpl.sessionOrder}/12
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {tpl.templateCode}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-slate-900">
                          {tpl.title}
                        </h3>
                      </div>

                      <span className="rounded-full bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 shrink-0">
                        {tpl.exercises?.length || 0} bài tập
                      </span>
                    </div>

                    {tpl.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        "{tpl.description}"
                      </p>
                    )}

                    {/* Exercises List inside template */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                        <span>Danh sách động tác chuẩn:</span>
                        <button
                          type="button"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                          className="text-emerald-700 hover:text-emerald-800 lowercase font-medium text-[11px] flex items-center gap-0.5 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Thu gọn</span>
                              <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Chi tiết kỹ thuật</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-2">
                        {tpl.exercises?.map((ex, idx) => (
                          <div
                            key={ex.id || idx}
                            className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">
                                {idx + 1}. {ex.exercise?.title || 'Động tác'}
                              </span>
                              <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                                {ex.exercise?.category || 'Chung'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 font-medium">
                              <span><strong>{ex.sets || 3}</strong> hiệp</span>
                              <span>•</span>
                              <span><strong>{ex.reps || 10}</strong> {ex.unit || 'lần'}</span>
                              {ex.weightKg !== null && ex.weightKg !== undefined && ex.weightKg > 0 && (
                                <>
                                  <span>•</span>
                                  <span>Tạ: <strong>{ex.weightKg}</strong> kg</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Nghỉ: <strong>{ex.restSeconds || 60}</strong>s</span>
                            </div>

                            {(isExpanded || tpl.exercises.length <= 3) && ex.exercise?.instructions && (
                              <p className="text-[11px] text-slate-500 bg-white p-2 rounded-lg border border-slate-100">
                                <strong className="text-slate-700">Kỹ thuật:</strong> {ex.exercise.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GIÁO ÁN TỰ TẠO THEO HỌC VIÊN                        */}
      {/* ========================================================= */}
      {activeTab === 'CUSTOM_PLANS' && (
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={customPlanSearch}
              onChange={(e) => setCustomPlanSearch(e.target.value)}
              placeholder="Tìm giáo án theo tiêu đề..."
              className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Loading State */}
          {isLoadingPlans && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách giáo án...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPlans && filteredPlans.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Chưa có giáo án tự tạo nào</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Bạn chưa tạo giáo án tùy chỉnh nào cho học viên. Hãy bấm nút "Soạn giáo án mới" phía trên để bắt đầu.
              </p>
            </div>
          )}

          {/* Plans List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2 py-0.5">
                          {plan.exercises?.length || 0} BÀI TẬP
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900">{plan.title}</h3>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Tạo ngày: {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Bạn có chắc chắn muốn xóa giáo án này không?')) {
                          deleteMutation.mutate(plan.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 text-xs font-semibold cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                      "{plan.notes}"
                    </p>
                  )}

                  {/* Exercises List inside plan */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Chi tiết các bài tập:
                    </h4>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {plan.exercises?.map((ex, idx) => (
                        <div
                          key={ex.id || idx}
                          className="rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="space-y-0.5 min-w-0">
                            <p className="font-bold text-slate-900 truncate">
                              {idx + 1}. {ex.exercise?.title || 'Bài tập'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {ex.sets || 3} hiệp × {ex.reps || 10} lần • {ex.weightKg || 0} kg • Nghỉ {ex.restSeconds || 60}s
                            </p>
                            {ex.coachFeedback && (
                              <p className="text-[11px] text-emerald-800 font-medium italic">
                                Lời dặn: {ex.coachFeedback}
                              </p>
                            )}
                          </div>
                          <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 shrink-0">
                            {ex.exercise?.category || 'Chung'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: KHO BÀI TẬP CHUẨN (M09 / 84 BÀI TẬP)              */}
      {/* ========================================================= */}
      {activeTab === 'EXERCISE_LIBRARY' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Tất cả ({exercisesKnowledge.length})
              </button>
              {exerciseCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Tra cứu bài tập theo tên hoặc kỹ thuật..."
                className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoadingExercises && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải kho bài tập chuẩn...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingExercises && filteredExercises.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
              <Dumbbell className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Không tìm thấy bài tập phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Hãy thử lại với nhóm cơ khác hoặc từ khóa tra cứu tổng quát hơn.
              </p>
            </div>
          )}

          {/* Exercises Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all hover:border-emerald-300 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-slate-900 leading-snug">
                      {ex.title}
                    </h4>
                    <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-black uppercase shrink-0">
                      {ex.category}
                    </span>
                  </div>

                  {ex.instructions && (
                    <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {ex.instructions}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    ID: {ex.id.slice(0, 8)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      handleAddExerciseToForm(ex);
                      setIsCreateOpen(true);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 gap-1 h-7 px-2.5 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Dùng bài này</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL / DRAWER TẠO GIÁO ÁN MỚI                             */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Soạn Giáo Án Mới</h3>
                  <p className="text-xs text-slate-500">
                    Chọn học viên và chọn bài tập từ kho Exercise Knowledge
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Học Viên & Tiêu Đề */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Học viên thụ hưởng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetMemberId}
                    onChange={(e) => setTargetMemberId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  >
                    <option value="">-- Chọn học viên --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.user?.id || m.id}>
                        {m.user?.fullName || m.user?.email || `Học viên #${m.id.slice(0, 6)}`} ({m.user?.phone || 'Chưa có SĐT'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Tiêu đề giáo án <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giáo án tăng cơ giảm mỡ tuần 1"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Ghi Chú / Lời Dặn Tổng Thể */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Ghi chú tổng thể (Tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Mục tiêu buổi học, lưu ý chấn thương hoặc dặn dò dinh dưỡng..."
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Lựa Chọn Bài Tập Chuẩn */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Thêm bài tập từ thư viện ({exercisesKnowledge.length} bài)
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Đã thêm: <strong className="text-emerald-700">{exercisesList.length}</strong> bài
                  </span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formExerciseSearch}
                    onChange={(e) => setFormExerciseSearch(e.target.value)}
                    placeholder="Gõ tên động tác để tìm kiếm..."
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* Horizontal scroll exercise suggestions */}
                <div className="flex gap-2 overflow-x-auto pb-1 max-h-36 flex-wrap">
                  {exercisesKnowledge
                    .filter(
                      (item) =>
                        !formExerciseSearch ||
                        item.title.toLowerCase().includes(formExerciseSearch.toLowerCase()) ||
                        item.category.toLowerCase().includes(formExerciseSearch.toLowerCase())
                    )
                    .slice(0, 15)
                    .map((item) => {
                      const isAdded = exercisesList.some((e) => e.exerciseId === item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddExerciseToForm(item)}
                          disabled={isAdded}
                          className={`rounded-lg px-2.5 py-1 text-xs font-medium border text-left transition-all shrink-0 cursor-pointer ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                              : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          + {item.title} ({item.category})
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Danh Sách Bài Tập Đã Thêm */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700">
                  Cấu hình bài tập trong giáo án ({exercisesList.length})
                </label>

                {exercisesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-3 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chưa có bài tập nào. Hãy chọn từ danh sách phía trên.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {exercisesList.map((item, idx) => (
                      <div
                        key={item.exerciseId}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">
                            {idx + 1}. {item.title || 'Bài tập'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExerciseFromForm(item.exerciseId)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-500">Số hiệp (Sets)</span>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={item.sets || 3}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'sets', Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500">Số lần (Reps)</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={item.reps || 10}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'reps', Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500">Mức tạ (kg)</span>
                            <input
                              type="number"
                              min={0}
                              max={500}
                              value={item.weightKg || 0}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'weightKg', Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-500">Nghỉ giữa hiệp (giây)</span>
                            <input
                              type="number"
                              min={0}
                              max={600}
                              step={5}
                              value={item.restSeconds || 60}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'restSeconds', Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Lời dặn HLV (Ví dụ: Thẳng lưng, siết cơ bụng khi nâng tạ)..."
                            value={item.coachFeedback || ''}
                            onChange={(e) =>
                              handleUpdateExerciseParam(idx, 'coachFeedback', e.target.value)
                            }
                            className="w-full rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={createMutation.isPending}
                className="text-xs font-semibold cursor-pointer"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || exercisesList.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Lưu &amp; Ban hành giáo án</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
