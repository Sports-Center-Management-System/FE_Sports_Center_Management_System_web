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
  Calendar,
  Users,
  ChevronDown,
  ChevronUp,
  Target,
  Timer,
  Copy,
  Check,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type {
  WorkoutExerciseDto,
  WorkoutTemplateItem,
  WorkoutPlanItem,
} from '../types/coach-portal.types';
import {
  parseExerciseInstructions,
  translateCategory,
  parseExerciseTitle,
  UNIT_TRANSLATIONS,
} from '../utils/exercise-metadata.utils';

type PlanTab = 'TEMPLATES' | 'CUSTOM_PLANS' | 'EXERCISE_LIBRARY';

const CATEGORY_ORDER: Record<string, number> = {
  warmup: 1,
  warm_up: 1,
  technique: 2,
  strength: 3,
  power: 4,
  core: 5,
  cardio: 6,
  sparring: 7,
  yoga_pose: 8,
  recovery: 9,
  cooldown: 10,
  cool_down: 10,
};

export const CoachWorkoutPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlanTab>('TEMPLATES');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // --- Tab 1: Templates ---
  const [templateDiscipline, setTemplateDiscipline] = useState<'ALL' | 'BOXING' | 'YOGA'>('ALL');
  const [templateWeekFilter, setTemplateWeekFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // --- Tab 2: Custom Plans ---
  const [customPlanSearch, setCustomPlanSearch] = useState<string>('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');

  // --- Tab 3: Exercise Library ---
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedExerciseDiscipline, setSelectedExerciseDiscipline] = useState<'ALL' | 'BOXING' | 'YOGA' | 'GYM'>('ALL');

  // --- Modal Form States for Creating/Editing Custom Plan ---
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');
  const [exercisesList, setExercisesList] = useState<
    Array<WorkoutExerciseDto & { title?: string; category?: string }>
  >([]);

  // Advanced filters inside the modal exercise picker
  const [formExerciseSearch, setFormExerciseSearch] = useState<string>('');
  const [formDisciplineFilter, setFormDisciplineFilter] = useState<'ALL' | 'BOXING' | 'YOGA' | 'GYM'>('ALL');
  const [formCategoryFilter, setFormCategoryFilter] = useState<string>('ALL');
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

  // Student lookup map
  const memberMap = useMemo(() => {
    const map = new Map<string, any>();
    members.forEach((m) => {
      map.set(m.id, m);
      if (m.user?.id) map.set(m.user.id, m);
    });
    return map;
  }, [members]);

  // Exercise knowledge lookup map
  const exerciseKnowledgeMap = useMemo(() => {
    const map = new Map<string, any>();
    exercisesKnowledge.forEach((item) => {
      map.set(item.id, item);
    });
    return map;
  }, [exercisesKnowledge]);

  // Discipline counts across exercise library
  const disciplineCounts = useMemo(() => {
    const counts = { ALL: exercisesKnowledge.length, BOXING: 0, YOGA: 0, GYM: 0 };
    exercisesKnowledge.forEach((item) => {
      const meta = parseExerciseInstructions(item.instructions);
      const disc = meta.discipline?.toUpperCase();
      if (disc === 'BOXING') counts.BOXING++;
      else if (disc === 'YOGA') counts.YOGA++;
      else if (disc === 'GYM') counts.GYM++;
    });
    return counts;
  }, [exercisesKnowledge]);

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

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingPlanId) throw new Error('Không tìm thấy giáo án cần cập nhật.');
      if (!planTitle.trim()) throw new Error('Vui lòng nhập tiêu đề giáo án.');
      if (exercisesList.length === 0) throw new Error('Vui lòng thêm ít nhất một bài tập vào giáo án.');

      return coachPortalApi.updateWorkoutPlan(editingPlanId, {
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
      const msg = err.response?.data?.message || err.message || 'Lỗi khi cập nhật giáo án';
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
    setEditingPlanId(null);
    setTargetMemberId('');
    setPlanTitle('');
    setPlanNotes('');
    setExercisesList([]);
    setFormExerciseSearch('');
    setFormDisciplineFilter('ALL');
    setFormCategoryFilter('ALL');
    setFormError(null);
  };

  const handleOpenEditPlan = (plan: WorkoutPlanItem) => {
    setEditingPlanId(plan.id);
    setTargetMemberId(plan.memberId);
    setPlanTitle(plan.title);
    setPlanNotes(plan.notes || '');

    const mapped = (plan.exercises || []).map((ex) => {
      const kItem = exerciseKnowledgeMap.get(ex.exerciseId);
      return {
        exerciseId: ex.exerciseId,
        title: ex.exercise?.title || kItem?.title || 'Bài tập',
        category: ex.exercise?.category || kItem?.category || 'Chung',
        sets: ex.sets || 3,
        reps: ex.reps || 10,
        weightKg: ex.weightKg !== null && ex.weightKg !== undefined ? Number(ex.weightKg) : 0,
        restSeconds: ex.restSeconds || 60,
        coachFeedback: ex.coachFeedback || '',
      };
    });

    setExercisesList(mapped);
    setFormExerciseSearch('');
    setFormDisciplineFilter('ALL');
    setFormCategoryFilter('ALL');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleAddExerciseToForm = (item: {
    id: string;
    title: string;
    category: string;
    instructions?: string;
  }) => {
    if (exercisesList.some((e) => e.exerciseId === item.id)) return;
    const meta = parseExerciseInstructions(item.instructions);
    const defaultReps = meta.unit === 'seconds' ? 30 : meta.unit === 'minutes' ? 5 : 10;
    const isWeighted =
      meta.equipment?.includes('dumbbell') ||
      meta.equipment?.includes('barbell') ||
      meta.equipment?.includes('kettlebell');

    setExercisesList((prev) => [
      ...prev,
      {
        exerciseId: item.id,
        title: item.title,
        category: item.category,
        sets: 3,
        reps: defaultReps,
        weightKg: isWeighted ? 20 : 0,
        restSeconds: meta.unit === 'seconds' ? 30 : 60,
        coachFeedback: '',
      },
    ]);
  };

  const handleRemoveExerciseFromForm = (exerciseId: string) => {
    setExercisesList((prev) => prev.filter((e) => e.exerciseId !== exerciseId));
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

  // Helper to clone a template into the custom plan modal
  const handleCloneTemplateToPlan = (tpl: WorkoutTemplateItem) => {
    setEditingPlanId(null);
    setPlanTitle(`Giáo án: ${tpl.title}`);
    setPlanNotes(tpl.description || `Lộ trình ${tpl.disciplineCode} - Tuần ${tpl.weekNumber} · Buổi ${tpl.sessionOrder}`);
    const mappedExercises = (tpl.exercises || []).map((ex) => ({
      exerciseId: ex.exerciseId,
      title: ex.exercise?.title || 'Bài tập',
      category: ex.exercise?.category || 'Chung',
      sets: ex.sets || 3,
      reps: ex.reps || 10,
      weightKg: Number(ex.weightKg) || 0,
      restSeconds: ex.restSeconds || 60,
      coachFeedback: '',
    }));
    setExercisesList(mappedExercises);
    setIsCreateOpen(true);
  };

  // Filtered lists
  const filteredTemplates = useMemo(() => {
    return templates.filter((tpl) => {
      const matchWeek =
        templateWeekFilter === 'ALL' || String(tpl.weekNumber) === templateWeekFilter;
      const q = templateSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        tpl.title.toLowerCase().includes(q) ||
        (tpl.templateCode && tpl.templateCode.toLowerCase().includes(q)) ||
        (tpl.description && tpl.description.toLowerCase().includes(q)) ||
        tpl.exercises?.some((e) => e.exercise?.title?.toLowerCase().includes(q));

      return matchWeek && matchSearch;
    });
  }, [templates, templateWeekFilter, templateSearch]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchStudent =
        selectedStudentFilter === 'ALL' || p.memberId === selectedStudentFilter;
      const q = customPlanSearch.trim().toLowerCase();
      const student = memberMap.get(p.memberId);
      const studentName = student?.user?.fullName?.toLowerCase() || '';

      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        studentName.includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q));

      return matchStudent && matchSearch;
    });
  }, [plans, selectedStudentFilter, customPlanSearch, memberMap]);

  const exerciseCategories = useMemo(() => {
    const set = new Set<string>();
    exercisesKnowledge.forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.toLowerCase()] || 99;
      const orderB = CATEGORY_ORDER[b.toLowerCase()] || 99;
      return orderA - orderB;
    });
  }, [exercisesKnowledge]);

  const filteredExercises = useMemo(() => {
    return exercisesKnowledge.filter((ex) => {
      const meta = parseExerciseInstructions(ex.instructions);
      const matchCategory =
        selectedCategory === 'ALL' || ex.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchDiscipline =
        selectedExerciseDiscipline === 'ALL' ||
        meta.discipline?.toUpperCase() === selectedExerciseDiscipline;

      const q = exerciseSearch.trim().toLowerCase();
      const { primary, secondary } = parseExerciseTitle(ex.title);
      const matchSearch =
        !q ||
        primary.toLowerCase().includes(q) ||
        (secondary && secondary.toLowerCase().includes(q)) ||
        ex.title.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        translateCategory(ex.category).toLowerCase().includes(q) ||
        (meta.muscleVi && meta.muscleVi.toLowerCase().includes(q)) ||
        (meta.equipmentVi && meta.equipmentVi.toLowerCase().includes(q)) ||
        (meta.instructionsText && meta.instructionsText.toLowerCase().includes(q));

      return matchCategory && matchDiscipline && matchSearch;
    });
  }, [exercisesKnowledge, selectedCategory, selectedExerciseDiscipline, exerciseSearch]);

  // Modal filtered exercises for the interactive picker
  const modalFilteredExercises = useMemo(() => {
    return exercisesKnowledge.filter((ex) => {
      const meta = parseExerciseInstructions(ex.instructions);
      const matchDiscipline =
        formDisciplineFilter === 'ALL' ||
        meta.discipline?.toUpperCase() === formDisciplineFilter;
      const matchCategory =
        formCategoryFilter === 'ALL' ||
        ex.category.toLowerCase() === formCategoryFilter.toLowerCase();

      const q = formExerciseSearch.trim().toLowerCase();
      const { primary, secondary } = parseExerciseTitle(ex.title);
      const matchSearch =
        !q ||
        primary.toLowerCase().includes(q) ||
        (secondary && secondary.toLowerCase().includes(q)) ||
        ex.title.toLowerCase().includes(q) ||
        ex.category.toLowerCase().includes(q) ||
        translateCategory(ex.category).toLowerCase().includes(q) ||
        (meta.muscleVi && meta.muscleVi.toLowerCase().includes(q)) ||
        (meta.equipmentVi && meta.equipmentVi.toLowerCase().includes(q));

      return matchDiscipline && matchCategory && matchSearch;
    });
  }, [exercisesKnowledge, formDisciplineFilter, formCategoryFilter, formExerciseSearch]);

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
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      {/* 1. Header with Architectural Elevation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
              Chuyên Môn Huấn Luyện
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
            Giáo Án &amp; Lộ Trình Đào Tạo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            Quản lý lộ trình 12 buổi chuẩn Boxing/Yoga và xây dựng kế hoạch tập luyện cá nhân hóa theo mục tiêu học viên.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleRefetch}
            disabled={isCurrentLoading || isCurrentRefetching}
            className="text-xs font-bold border-slate-200/90 bg-white/90 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCurrentRefetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm shadow-emerald-600/25 active:scale-[0.98] transition-all cursor-pointer px-4 py-2"
          >
            <Plus className="h-4 w-4" />
            <span>Soạn giáo án mới</span>
          </Button>
        </div>
      </div>

      {/* 2. Floating Segmented Navigation Pill */}
      <div className="flex items-center gap-1.5 p-1 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60'
          }`}
        >
          <Calendar className="h-4 w-4 text-emerald-500" />
          <span>Lộ Trình Mẫu (12 Buổi)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'TEMPLATES'
                ? 'bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600'
            }`}
          >
            {templates.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CUSTOM_PLANS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'CUSTOM_PLANS'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60'
          }`}
        >
          <Users className="h-4 w-4 text-blue-500" />
          <span>Giáo Án Học Viên</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'CUSTOM_PLANS'
                ? 'bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600'
            }`}
          >
            {plans.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('EXERCISE_LIBRARY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'EXERCISE_LIBRARY'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60'
          }`}
        >
          <Dumbbell className="h-4 w-4 text-amber-500" />
          <span>Thư Viện Động Tác</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              activeTab === 'EXERCISE_LIBRARY'
                ? 'bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800'
                : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600'
            }`}
          >
            {exercisesKnowledge.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: LỘ TRÌNH MẪU (24 BUỔI BOXING & YOGA)                */}
      {/* ========================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-4">
          {/* Integrated Modern Control Panel */}
          <div className="p-4 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Discipline Switcher */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    templateDiscipline === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  Tất cả môn ({templates.length})
                </button>
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
                  placeholder="Tìm theo tên buổi học, bài tập..."
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

            {/* Week Progression Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100/80 dark:border-slate-800 pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Giai đoạn:
              </span>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tất cả tuần
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('1')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '1'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tuần 1 · Căn bản (Buổi 1-3)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('2')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '2'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tuần 2 · Nâng cao (Buổi 4-6)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('3')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '3'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tuần 3 · Cường độ (Buổi 7-9)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('4')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '4'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tuần 4 · Tổng hợp (Buổi 10-12)
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoadingTemplates && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Đang tải đề cương lộ trình...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingTemplates && filteredTemplates.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8">
              <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy buổi học phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thử chọn tuần khác hoặc tìm kiếm với từ khóa tổng quát hơn.
              </p>
            </div>
          )}

          {/* Double-Bezel Card Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredTemplates.map((tpl) => {
              const isBoxing = tpl.disciplineCode?.toUpperCase() === 'BOXING';
              const isExpanded = expandedTemplateId === tpl.id;
              const totalSets = (tpl.exercises || []).reduce((sum, e) => sum + (e.sets || 3), 0);

              return (
                <div
                  key={tpl.id}
                  className="p-1 rounded-3xl bg-gradient-to-b from-white/95 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-900/60 border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-5 rounded-[calc(1.5rem-4px)] bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-md space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                            BUỔI {String(tpl.sessionOrder).padStart(2, '0')} / 12
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg border ${
                              isBoxing
                                ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                            }`}
                          >
                            {tpl.disciplineCode}
                          </span>
                          <span className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-semibold">
                            Tuần {tpl.weekNumber}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                          {tpl.title}
                        </h3>
                      </div>

                      <div className="text-right shrink-0 space-y-0.5">
                        <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2.5 py-1 border border-slate-200/60 dark:border-slate-700">
                          {tpl.exercises?.length || 0} bài · {totalSets} hiệp
                        </span>
                      </div>
                    </div>

                    {/* Description Note Box */}
                    {tpl.description && (
                      <div className="border-l-2 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 px-3.5 py-2 rounded-r-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        "{tpl.description}"
                      </div>
                    )}

                    {/* Exercises Timeline Sequence */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Động tác kỹ thuật ({tpl.exercises?.length} bài)</span>
                        <button
                          type="button"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                          className="text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] flex items-center gap-0.5 cursor-pointer lowercase"
                        >
                          {isExpanded ? (
                            <>
                              <span>Thu gọn</span>
                              <ChevronUp className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Xem kỹ thuật</span>
                              <ChevronDown className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {tpl.exercises?.map((ex, idx) => {
                          const meta = parseExerciseInstructions(ex.exercise?.instructions);
                          const { primary, secondary } = parseExerciseTitle(ex.exercise?.title);
                          const unitStr =
                            (ex.unit && UNIT_TRANSLATIONS[ex.unit.toLowerCase()]) ||
                            meta.unitVi ||
                            'lần';

                          return (
                            <div
                              key={ex.id || idx}
                              className="rounded-2xl border border-slate-100/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 text-xs space-y-1.5 hover:bg-slate-100/60 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 font-medium truncate block -mt-0.5">
                                        {secondary}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="rounded-md bg-white dark:bg-slate-700 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                  {translateCategory(ex.exercise?.category)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pl-7">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60">
                                  {ex.sets || 3} hiệp
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60">
                                  {ex.reps || 10} {unitStr}
                                </span>
                                {ex.weightKg !== null && ex.weightKg !== undefined && ex.weightKg > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/60">
                                    Tạ: {ex.weightKg} kg
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Nghỉ {ex.restSeconds || 60}s
                                </span>
                                {meta.muscleVi && (
                                  <span className="text-slate-500 font-medium ml-1">
                                    • {meta.muscleVi}
                                  </span>
                                )}
                              </div>

                              {(isExpanded || tpl.exercises.length <= 3) && meta.instructionsText && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed ml-7">
                                  <strong className="text-slate-700 dark:text-slate-300">Kỹ thuật:</strong> {meta.instructionsText}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-medium text-slate-400">
                        {tpl.templateCode}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleCloneTemplateToPlan(tpl)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all duration-150 shadow-2xs active:scale-[0.98] cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Dùng mẫu này cho học viên</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: GIÁO ÁN HỌC VIÊN (CÁ NHÂN HÓA THEO THỂ LỰC)        */}
      {/* ========================================================= */}
      {activeTab === 'CUSTOM_PLANS' && (
        <div className="space-y-4">
          {/* Integrated Student Filter & Search Bar */}
          <div className="p-4 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Student Filter Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Học viên:
                </span>
                <select
                  value={selectedStudentFilter}
                  onChange={(e) => setSelectedStudentFilter(e.target.value)}
                  className="rounded-xl border border-slate-200/80 bg-white/90 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-2xs focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="ALL">Tất cả học viên ({plans.length} giáo án)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.user?.id || m.id}>
                      {m.user?.fullName || m.user?.email || `Học viên #${m.id.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search input */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={customPlanSearch}
                  onChange={(e) => setCustomPlanSearch(e.target.value)}
                  placeholder="Tìm theo tiêu đề giáo án hoặc tên học viên..."
                  className="w-full rounded-xl border border-slate-200/80 bg-white/90 dark:bg-slate-800 pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:border-emerald-500 focus:outline-hidden transition-all"
                />
                {customPlanSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomPlanSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoadingPlans && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Đang tải danh sách giáo án...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPlans && filteredPlans.length === 0 && (
            <div className="py-16 text-center space-y-4 rounded-3xl border border-dashed border-slate-200 bg-white/80 backdrop-blur-md p-8">
              <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Chưa có giáo án tùy chỉnh nào
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bạn có thể soạn giáo án mới cho học viên hoặc bấm "Dùng mẫu này cho học viên" ở tab Lộ Trình Mẫu để sao chép nhanh.
                </p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 shadow-sm active:scale-[0.98] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Soạn giáo án đầu tiên</span>
              </Button>
            </div>
          )}

          {/* Plans Grid (Double-Bezel Architecture) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredPlans.map((plan) => {
              const student = memberMap.get(plan.memberId);
              const studentName = student?.user?.fullName || student?.user?.email || 'Học viên PT';
              const studentInitial = studentName.charAt(0).toUpperCase();
              const totalSets = (plan.exercises || []).reduce((sum, e) => sum + (e.sets || 3), 0);

              return (
                <div
                  key={plan.id}
                  className="p-1 rounded-3xl bg-gradient-to-b from-white/95 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-900/60 border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-5 rounded-[calc(1.5rem-4px)] bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-md space-y-4">
                    {/* Student Info Card Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs ring-2 ring-white/80">
                          {studentInitial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                              {studentName}
                            </h4>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Áp dụng
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {student?.user?.phone || 'Học viên kèm riêng 1:1'} · Ngày tạo: {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-emerald-400 h-8 px-2.5 gap-1.5 cursor-pointer rounded-xl transition-colors font-bold text-xs"
                          title="Chỉnh sửa giáo án này"
                        >
                          <Pencil className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Chỉnh sửa</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc chắn muốn xóa giáo án này không?')) {
                              deleteMutation.mutate(plan.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0 cursor-pointer rounded-xl transition-colors"
                          title="Xóa giáo án này"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Plan Title & Volume Summary */}
                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-2 py-0.5 text-[10px] font-bold uppercase">
                          {plan.exercises?.length || 0} BÀI TẬP
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Tổng khối lượng: <strong>{totalSets}</strong> hiệp
                        </span>
                      </div>
                    </div>

                    {/* Coach Notes */}
                    {plan.notes && (
                      <div className="border-l-2 border-blue-500 bg-blue-50/40 dark:bg-blue-950/20 px-3.5 py-2 rounded-r-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                        <strong className="text-slate-700 dark:text-slate-200 not-italic">Lời dặn chung:</strong> "{plan.notes}"
                      </div>
                    )}

                    {/* Exercises List inside plan */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Trình tự động tác tập luyện:
                      </h5>

                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {plan.exercises?.map((ex, idx) => {
                          const kItem = exerciseKnowledgeMap.get(ex.exerciseId);
                          const meta = parseExerciseInstructions(
                            kItem?.instructions || (ex.exercise as any)?.instructions
                          );
                          const { primary, secondary } = parseExerciseTitle(
                            ex.exercise?.title || kItem?.title
                          );
                          const unitStr = meta.unitVi || 'lần';

                          return (
                            <div
                              key={ex.id || idx}
                              className="rounded-2xl border border-slate-100/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-2.5 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-slate-200/60 shadow-2xs">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 font-medium truncate block -mt-0.5">
                                        {secondary}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="rounded-md bg-white dark:bg-slate-700 border border-slate-200/80 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                  {translateCategory(ex.exercise?.category)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] pl-7">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/60">
                                  {ex.sets || 3} hiệp
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200/60">
                                  {ex.reps || 10} {unitStr}
                                </span>
                                {ex.weightKg !== null && ex.weightKg !== undefined && ex.weightKg > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200/60">
                                    Tạ: {ex.weightKg} kg
                                  </span>
                                )}
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  Nghỉ {ex.restSeconds || 60}s
                                </span>
                              </div>

                              {ex.coachFeedback && (
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium pl-7 italic bg-emerald-50/50 dark:bg-emerald-950/20 py-1 px-2 rounded-lg border border-emerald-100 dark:border-emerald-900/40">
                                  Lời dặn HLV: {ex.coachFeedback}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-slate-400">
                        Mã giáo án: #{plan.id.slice(0, 8)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleOpenEditPlan(plan)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold transition-all duration-150 shadow-2xs active:scale-[0.98] cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Chỉnh sửa giáo án</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: THƯ VIỆN ĐỘNG TÁC (84 EXERCISE KNOWLEDGE CARDS)    */}
      {/* ========================================================= */}
      {activeTab === 'EXERCISE_LIBRARY' && (
        <div className="space-y-4">
          {/* Integrated Modern Control Bar with Double-Bezel Look */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border border-white/60 dark:border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Discipline Segmented Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setSelectedExerciseDiscipline('ALL')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/70'
                  }`}
                >
                  Tất cả môn ({disciplineCounts.ALL})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExerciseDiscipline('BOXING')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'BOXING'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-rose-700 hover:bg-rose-50 border border-rose-200/70'
                  }`}
                >
                  Boxing ({disciplineCounts.BOXING})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExerciseDiscipline('YOGA')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'YOGA'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-indigo-700 hover:bg-indigo-50 border border-indigo-200/70'
                  }`}
                >
                  Yoga ({disciplineCounts.YOGA})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExerciseDiscipline('GYM')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'GYM'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white/80 dark:bg-slate-800 text-amber-800 hover:bg-amber-50 border border-amber-200/70'
                  }`}
                >
                  Gym ({disciplineCounts.GYM})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Tra cứu theo tên bài, nhóm cơ, thiết bị..."
                  className="w-full rounded-xl border border-slate-200/80 bg-white/90 dark:bg-slate-800 pl-9 pr-8 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden transition-all shadow-2xs"
                />
                {exerciseSearch && (
                  <button
                    type="button"
                    onClick={() => setExerciseSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (Fully localized to Vietnamese, naturally ordered) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100/80 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                Nhóm bài:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Tất cả nhóm
              </button>
              {exerciseCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                  }`}
                >
                  {translateCategory(cat)}
                </button>
              ))}
            </div>

            {/* Filter Stats Bar */}
            <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
              <span>
                Hiển thị <strong>{filteredExercises.length}</strong> / {exercisesKnowledge.length} bài tập chuẩn
                {selectedExerciseDiscipline !== 'ALL' && ` (${selectedExerciseDiscipline})`}
                {selectedCategory !== 'ALL' && ` · ${translateCategory(selectedCategory)}`}
              </span>

              {(selectedCategory !== 'ALL' || selectedExerciseDiscipline !== 'ALL' || exerciseSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedExerciseDiscipline('ALL');
                    setExerciseSearch('');
                  }}
                  className="text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {isLoadingExercises && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Đang tải thư viện bài tập...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingExercises && filteredExercises.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-3xl border border-dashed border-slate-200 bg-white/80 p-8">
              <Dumbbell className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">Không tìm thấy bài tập phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thử chọn nhóm cơ khác hoặc tìm kiếm với từ khóa rộng hơn.
              </p>
            </div>
          )}

          {/* Double-Bezel Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExercises.map((ex) => {
              const meta = parseExerciseInstructions(ex.instructions);
              const { primary, secondary } = parseExerciseTitle(ex.title);
              const isBoxing =
                meta.discipline === 'BOXING' || ex.category?.toLowerCase() === 'boxing';
              const isYoga =
                meta.discipline === 'YOGA' || ex.category?.toLowerCase() === 'yoga';

              return (
                <div
                  key={ex.id}
                  className="p-1 rounded-3xl bg-gradient-to-b from-white/95 to-slate-100/70 dark:from-slate-800/80 dark:to-slate-900/60 border border-white/80 dark:border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="p-5 rounded-[calc(1.5rem-4px)] bg-white/95 dark:bg-[#131b26]/95 backdrop-blur-md space-y-3.5 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Header: Title and Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                            {primary}
                          </h4>
                          {secondary && (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate block mt-0.5">
                              {secondary}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {meta.discipline && (
                            <span
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-black uppercase border ${
                                isBoxing
                                  ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                                  : isYoga
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                                  : 'bg-amber-50 text-amber-800 border-amber-200/80'
                              }`}
                            >
                              {meta.discipline}
                            </span>
                          )}
                          <span className="rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 px-2 py-0.5 text-[10px] font-semibold">
                            {translateCategory(ex.category)}
                          </span>
                        </div>
                      </div>

                      {/* Clean 3-Column Specification Tiles */}
                      <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px]">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                            <Target className="w-3 h-3 text-slate-400 shrink-0" />
                            Cơ chính
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {meta.muscleVi}
                          </p>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                            <Dumbbell className="w-3 h-3 text-slate-400 shrink-0" />
                            Thiết bị
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {meta.equipmentVi}
                          </p>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-medium">
                            <Timer className="w-3 h-3 text-slate-400 shrink-0" />
                            Đơn vị
                          </span>
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {meta.unitVi}
                          </p>
                        </div>
                      </div>

                      {/* Technical Coaching Guidance */}
                      {meta.instructionsText ? (
                        <div className="p-2.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                          "{meta.instructionsText}"
                        </div>
                      ) : null}
                    </div>

                    {/* Tactile Action Button */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddExerciseToForm(ex);
                          setIsCreateOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-xs font-bold transition-all duration-200 shadow-2xs active:scale-[0.98] cursor-pointer group"
                      >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200 text-emerald-400 group-hover:text-white" />
                        <span>Thêm vào giáo án</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SOẠN GIÁO ÁN MỚI (VỚI SPLIT EXERCISE STUDIO)       */}
      {/* ========================================================= */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="w-full max-w-6xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-2xl text-white flex items-center justify-center shadow-xs ${
                    editingPlanId ? 'bg-amber-600' : 'bg-emerald-600'
                  }`}
                >
                  {editingPlanId ? <Pencil className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {editingPlanId ? 'Chỉnh Sửa Giáo Án Học Viên' : 'Soạn Giáo Án Huấn Luyện Mới'}
                    </h3>
                    {editingPlanId && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[10px] border border-amber-300 dark:border-amber-700">
                        Đang chỉnh sửa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {editingPlanId
                      ? 'Cập nhật lại danh sách bài tập, số hiệp, khối lượng tạ và dặn dò HLV cho học viên'
                      : 'Chọn động tác từ kho bài tập chuẩn và cá nhân hóa khối lượng tập luyện cho học viên'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Split 2-Column Studio on Desktop */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-semibold text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ========================================================= */}
                {/* LEFT COLUMN: KHO BÀI TẬP (7 COLS)                        */}
                {/* ========================================================= */}
                <div className="lg:col-span-7 flex flex-col space-y-3.5 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200/70 dark:border-slate-800">
                  {/* Header of Picker */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        Kho Bài Tập Chuẩn
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Bấm "+ Thêm" để đưa động tác vào giáo án học viên
                      </p>
                    </div>

                    <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                      Đã chọn: <strong>{exercisesList.length}</strong> bài
                    </span>
                  </div>

                  {/* Filter controls */}
                  <div className="space-y-2.5">
                    {/* Disciplines & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                        <button
                          type="button"
                          onClick={() => setFormDisciplineFilter('ALL')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            formDisciplineFilter === 'ALL'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          Tất cả ({disciplineCounts.ALL})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDisciplineFilter('BOXING')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            formDisciplineFilter === 'BOXING'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-rose-700 hover:bg-rose-50 border border-rose-200'
                          }`}
                        >
                          Boxing ({disciplineCounts.BOXING})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDisciplineFilter('YOGA')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            formDisciplineFilter === 'YOGA'
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-indigo-700 hover:bg-indigo-50 border border-indigo-200'
                          }`}
                        >
                          Yoga ({disciplineCounts.YOGA})
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormDisciplineFilter('GYM')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            formDisciplineFilter === 'GYM'
                              ? 'bg-amber-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-amber-800 hover:bg-amber-50 border border-amber-200'
                          }`}
                        >
                          Gym ({disciplineCounts.GYM})
                        </button>
                      </div>

                      <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          value={formExerciseSearch}
                          onChange={(e) => setFormExerciseSearch(e.target.value)}
                          placeholder="Tìm theo tên bài, cơ chính..."
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8.5 pr-7 py-1 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                        />
                        {formExerciseSearch && (
                          <button
                            type="button"
                            onClick={() => setFormExerciseSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Categories */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => setFormCategoryFilter('ALL')}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                          formCategoryFilter === 'ALL'
                            ? 'bg-slate-800 text-white'
                            : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tất cả nhóm
                      </button>
                      {exerciseCategories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormCategoryFilter(cat)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                            formCategoryFilter.toLowerCase() === cat.toLowerCase()
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {translateCategory(cat)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exercise Picker Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                    {modalFilteredExercises.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-slate-400 space-y-2">
                        <Dumbbell className="h-7 w-7 text-slate-300 mx-auto" />
                        <p>Không có bài tập nào phù hợp với bộ lọc tìm kiếm.</p>
                      </div>
                    ) : (
                      modalFilteredExercises.map((item) => {
                        const isAdded = exercisesList.some((e) => e.exerciseId === item.id);
                        const meta = parseExerciseInstructions(item.instructions);
                        const { primary, secondary } = parseExerciseTitle(item.title);
                        const isBoxing = meta.discipline === 'BOXING';
                        const isYoga = meta.discipline === 'YOGA';

                        return (
                          <div
                            key={item.id}
                            className={`p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                              isAdded
                                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 shadow-2xs'
                                : 'border-slate-200/90 dark:border-slate-700/80 bg-white dark:bg-slate-800/90 hover:border-emerald-300 hover:bg-slate-50/70 shadow-2xs'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1">
                                  {meta.discipline && (
                                    <span
                                      className={`rounded-md px-1.5 py-0.2 text-[9px] font-black uppercase border ${
                                        isBoxing
                                          ? 'bg-rose-50 text-rose-700 border-rose-200/70'
                                          : isYoga
                                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200/70'
                                          : 'bg-amber-50 text-amber-800 border-amber-200/70'
                                      }`}
                                    >
                                      {meta.discipline}
                                    </span>
                                  )}
                                  <span className="rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/70 px-1.5 py-0.2 text-[9px] font-semibold">
                                    {translateCategory(item.category)}
                                  </span>
                                </div>

                                {isAdded ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExerciseFromForm(item.id)}
                                    className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-rose-600 text-white text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer group"
                                    title="Bấm để bỏ chọn động tác"
                                  >
                                    <Check className="w-3 h-3 group-hover:hidden" />
                                    <X className="w-3 h-3 hidden group-hover:inline" />
                                    <span className="group-hover:hidden">Đã chọn</span>
                                    <span className="hidden group-hover:inline">Bỏ chọn</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAddExerciseToForm(item)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-emerald-600 text-white dark:bg-slate-700 dark:hover:bg-emerald-600 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all active:scale-[0.97] cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Thêm</span>
                                  </button>
                                )}
                              </div>

                              <div>
                                <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate leading-snug">
                                  {primary}
                                </h5>
                                {secondary && (
                                  <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate -mt-0.5">
                                    {secondary}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                              <span className="truncate">🎯 {meta.muscleVi}</span>
                              <span className="truncate">🏋️ {meta.equipmentVi}</span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* ========================================================= */}
                {/* RIGHT COLUMN: GIÁO ÁN ĐANG SOẠN (5 COLS)                   */}
                {/* ========================================================= */}
                <div className="lg:col-span-5 flex flex-col space-y-4">
                  {/* Target Member & Title */}
                  <div className="p-4 rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          Học viên thụ hưởng <span className="text-rose-500">*</span>
                        </label>
                        {editingPlanId && (
                          <span className="text-[10px] font-semibold text-slate-400 italic">
                            (Cố định khi sửa)
                          </span>
                        )}
                      </div>
                      <select
                        value={targetMemberId}
                        onChange={(e) => setTargetMemberId(e.target.value)}
                        disabled={!!editingPlanId}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Chọn học viên nhận giáo án --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.user?.id || m.id}>
                            {m.user?.fullName || m.user?.email || `Học viên #${m.id.slice(0, 6)}`} ({m.user?.phone || 'Chưa có SĐT'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        Tiêu đề giáo án <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Boxing tuần 1 - Nền tảng tư thế & Jab-Cross"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Ghi chú tổng thể của HLV (Tùy chọn)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Mục tiêu buổi học, dặn dò dinh dưỡng, hồi phục..."
                        value={planNotes}
                        onChange={(e) => setPlanNotes(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:border-emerald-500 focus:outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  {/* Configured Exercises in Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                        Cấu Hình Bài Tập ({exercisesList.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {exercisesList.length > 0 ? 'Điều chỉnh hiệp, lần, tạ, nghỉ' : ''}
                      </span>
                    </div>

                    {exercisesList.length === 0 ? (
                      <div className="p-8 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-2">
                        <Dumbbell className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                          Chưa có bài tập nào trong giáo án
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Chọn các động tác kỹ thuật từ danh mục bên trái để bắt đầu xây dựng giáo án.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                        {exercisesList.map((item, idx) => {
                          const { primary, secondary } = parseExerciseTitle(item.title);
                          return (
                            <div
                              key={item.exerciseId}
                              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3 space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 truncate block -mt-0.5">
                                        {secondary}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[9px] font-semibold text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-600 shrink-0">
                                    {translateCategory(item.category)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveExerciseFromForm(item.exerciseId)}
                                  className="text-rose-500 hover:text-rose-700 text-xs font-bold cursor-pointer shrink-0"
                                  title="Xóa động tác này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="grid grid-cols-4 gap-1.5">
                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    Hiệp
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={item.sets || 3}
                                    onChange={(e) =>
                                      handleUpdateExerciseParam(idx, 'sets', Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    Lần / Giây
                                  </span>
                                  <input
                                    type="number"
                                    min={1}
                                    max={600}
                                    value={item.reps || 10}
                                    onChange={(e) =>
                                      handleUpdateExerciseParam(idx, 'reps', Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    Tạ (kg)
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={500}
                                    value={item.weightKg || 0}
                                    onChange={(e) =>
                                      handleUpdateExerciseParam(idx, 'weightKg', Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-0.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">
                                    Nghỉ (s)
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    max={600}
                                    step={5}
                                    value={item.restSeconds || 60}
                                    onChange={(e) =>
                                      handleUpdateExerciseParam(idx, 'restSeconds', Number(e.target.value))
                                    }
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 text-center"
                                  />
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="Lời dặn kỹ thuật của HLV cho động tác này..."
                                  value={item.coachFeedback || ''}
                                  onChange={(e) =>
                                    handleUpdateExerciseParam(idx, 'coachFeedback', e.target.value)
                                  }
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-[11px] text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 px-6 py-4 shrink-0">
              <div className="text-xs text-slate-500">
                {exercisesList.length > 0 ? (
                  <span>
                    Giáo án gồm <strong>{exercisesList.length}</strong> bài tập
                  </span>
                ) : (
                  <span>Chưa chọn bài tập</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={() => (editingPlanId ? updateMutation.mutate() : createMutation.mutate())}
                  disabled={createMutation.isPending || updateMutation.isPending || exercisesList.length === 0}
                  className={`${
                    editingPlanId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white text-xs font-bold gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.98]`}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    {editingPlanId
                      ? `Lưu cập nhật giáo án (${exercisesList.length})`
                      : `Lưu & Ban hành giáo án (${exercisesList.length})`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
