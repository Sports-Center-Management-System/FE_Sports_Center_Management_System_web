import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { createPortal } from 'react-dom';
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
  Check,
  Pencil,
  Filter,
  ArrowUpDown,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type {
  WorkoutExerciseDto,
  WorkoutTemplateItem,
  WorkoutPlanItem,
  WorkoutRecommendation,
} from '../types/coach-portal.types';
import {
  parseExerciseInstructions,
  translateCategory,
  parseExerciseTitle,
  UNIT_TRANSLATIONS,
  getExerciseDiscipline,
} from '../utils/exercise-metadata.utils';
import { WorkoutPlanDetailModal } from '@/components/common/workout-plan-detail-modal';
import { InbodyRecommendationCard } from '../components/inbody-recommendation-card';
import { useAuth } from '@/context/auth-context';

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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlanTab>('CUSTOM_PLANS');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);

  // Modal Detail State (Unified Workout Plan Modal)
  const [viewingPlan, setViewingPlan] = useState<WorkoutPlanItem | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplateItem | null>(null);

  // --- Tab 1: Templates ---
  const [templateDiscipline, setTemplateDiscipline] = useState<'BOXING' | 'YOGA'>('BOXING');
  const [templateWeekFilter, setTemplateWeekFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);

  // --- Tab 2: Custom Plans ---
  const [customPlanSearch, setCustomPlanSearch] = useState<string>('');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('ALL');
  const [dateSort, setDateSort] = useState<'DESC' | 'ASC'>('DESC');

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
  const [recommendationHidden, setRecommendationHidden] = useState<boolean>(false);

  // Queries
  const {
    data: templates = [],
    isLoading: isLoadingTemplates,
    isRefetching: isRefetchingTemplates,
    refetch: refetchTemplates,
  } = useQuery({
    queryKey: ['coach', 'workout-templates', templateDiscipline],
    queryFn: () => coachPortalApi.getWorkoutTemplates(templateDiscipline),
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
      const disc = getExerciseDiscipline(item);
      counts[disc]++;
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
    setRecommendationHidden(false);
  };

  // One click from the InBody assistant: add its exercises (skipping ones already in the
  // plan) and its cardio/nutrition advice; the coach can still adjust everything before saving.
  const handleApplyRecommendation = (rec: WorkoutRecommendation) => {
    setExercisesList((prev) => [
      ...prev,
      ...rec.recommendedExercises
        .filter((ex) => !prev.some((item) => item.exerciseId === ex.exerciseId))
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          title: ex.exerciseName,
          category: ex.category || 'Chung',
          sets: ex.sets,
          reps: ex.reps,
          weightKg: 0,
          restSeconds: 60,
          coachFeedback: ex.notes || '',
        })),
    ]);
    if (!planTitle.trim() && rec.primaryGoalTitle) setPlanTitle(`Giáo án ${rec.primaryGoalTitle}`);
    const advice = [
      rec.cardioPrescription
        ? `Cardio ${rec.cardioPrescription.targetZone.replace('_', ' ')} ${rec.cardioPrescription.durationMinutes} phút cuối buổi: ${rec.cardioPrescription.reason}`
        : null,
      rec.nutritionAdvice
        ? `Dinh dưỡng: khoảng ${rec.nutritionAdvice.targetDailyCalories} kcal/ngày, ${rec.nutritionAdvice.proteinTargetGrams} g protein. ${rec.nutritionAdvice.guideline}`
        : null,
    ].filter((line): line is string => Boolean(line) && !planNotes.includes(line as string));
    if (advice.length > 0)
      setPlanNotes((current) => [current.trim(), ...advice].filter(Boolean).join('\n'));
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
    const list = plans.filter((p) => {
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

    return list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return dateSort === 'DESC' ? timeB - timeA : timeA - timeB;
    });
  }, [plans, selectedStudentFilter, customPlanSearch, memberMap, dateSort]);

  // Dynamic categories for Tab 3 (filtered by selected discipline)
  const exerciseCategories = useMemo(() => {
    const map = new Map<string, number>();
    exercisesKnowledge.forEach((item) => {
      const disc = getExerciseDiscipline(item);
      if (selectedExerciseDiscipline === 'ALL' || disc === selectedExerciseDiscipline) {
        const cat = item.category?.toLowerCase().trim();
        if (cat) {
          map.set(cat, (map.get(cat) || 0) + 1);
        }
      }
    });
    return Array.from(map.entries())
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => {
        const orderA = CATEGORY_ORDER[a.cat] || 99;
        const orderB = CATEGORY_ORDER[b.cat] || 99;
        return orderA - orderB;
      });
  }, [exercisesKnowledge, selectedExerciseDiscipline]);

  const handleSelectDiscipline = (disc: 'ALL' | 'BOXING' | 'YOGA' | 'GYM') => {
    setSelectedExerciseDiscipline(disc);
    if (selectedCategory !== 'ALL') {
      const stillValid = exercisesKnowledge.some((item) => {
        const d = getExerciseDiscipline(item);
        return (
          (disc === 'ALL' || d === disc) &&
          item.category?.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
        );
      });
      if (!stillValid) {
        setSelectedCategory('ALL');
      }
    }
  };

  const filteredExercises = useMemo(() => {
    return exercisesKnowledge.filter((ex) => {
      const disc = getExerciseDiscipline(ex);
      const matchDiscipline =
        selectedExerciseDiscipline === 'ALL' || disc === selectedExerciseDiscipline;
      const matchCategory =
        selectedCategory === 'ALL' || ex.category.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

      const q = exerciseSearch.trim().toLowerCase();
      const meta = parseExerciseInstructions(ex.instructions);
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

      return matchDiscipline && matchCategory && matchSearch;
    });
  }, [exercisesKnowledge, selectedCategory, selectedExerciseDiscipline, exerciseSearch]);

  // Dynamic categories for Modal Picker (filtered by form discipline filter)
  const modalExerciseCategories = useMemo(() => {
    const map = new Map<string, number>();
    exercisesKnowledge.forEach((item) => {
      const disc = getExerciseDiscipline(item);
      if (formDisciplineFilter === 'ALL' || disc === formDisciplineFilter) {
        const cat = item.category?.toLowerCase().trim();
        if (cat) {
          map.set(cat, (map.get(cat) || 0) + 1);
        }
      }
    });
    return Array.from(map.entries())
      .map(([cat, count]) => ({ cat, count }))
      .sort((a, b) => {
        const orderA = CATEGORY_ORDER[a.cat] || 99;
        const orderB = CATEGORY_ORDER[b.cat] || 99;
        return orderA - orderB;
      });
  }, [exercisesKnowledge, formDisciplineFilter]);

  const handleSelectFormDiscipline = (disc: 'ALL' | 'BOXING' | 'YOGA' | 'GYM') => {
    setFormDisciplineFilter(disc);
    if (formCategoryFilter !== 'ALL') {
      const stillValid = exercisesKnowledge.some((item) => {
        const d = getExerciseDiscipline(item);
        return (
          (disc === 'ALL' || d === disc) &&
          item.category?.toLowerCase().trim() === formCategoryFilter.toLowerCase().trim()
        );
      });
      if (!stillValid) {
        setFormCategoryFilter('ALL');
      }
    }
  };

  // Modal filtered exercises for the interactive picker
  const modalFilteredExercises = useMemo(() => {
    return exercisesKnowledge.filter((ex) => {
      const disc = getExerciseDiscipline(ex);
      const matchDiscipline =
        formDisciplineFilter === 'ALL' || disc === formDisciplineFilter;
      const matchCategory =
        formCategoryFilter === 'ALL' || ex.category.toLowerCase().trim() === formCategoryFilter.toLowerCase().trim();

      const q = formExerciseSearch.trim().toLowerCase();
      const meta = parseExerciseInstructions(ex.instructions);
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

  const location = useLocation();
  const coachBasePath = location.pathname.startsWith('/portal/coach') ? '/portal/coach' : '/coach';

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-24">
      {/* 1. HEADER: Benchmark reception standard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <Link
              to={`${coachBasePath}/schedule`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#008b74] hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Lịch HLV
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1">
            Giáo án &amp; Lộ trình
          </h1>
          <p className="text-xs text-white mt-0.5">
            Quản lý giáo án tập luyện cá nhân hóa theo từng học viên, chuẩn hóa lộ trình 12 buổi và tra cứu kỹ thuật chuẩn
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={handleRefetch}
            disabled={isCurrentLoading || isCurrentRefetching}
            className="text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer h-9 px-3 rounded-xl shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isCurrentRefetching ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </Button>

          <Button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 cursor-pointer h-9 px-4 rounded-xl shadow-xs active:scale-[0.98] transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Soạn giáo án mới</span>
          </Button>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#008b74] border border-emerald-200/70">
            Giáo án &amp; Lộ trình
          </span>
        </div>
      </div>

      {/* 2. SEGMENTED NAVIGATION BAR */}
      <div className="flex items-center gap-2 p-1.5 bg-white rounded-2xl border border-slate-200/90 w-full sm:w-fit overflow-x-auto shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('CUSTOM_PLANS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'CUSTOM_PLANS'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className={`h-4 w-4 ${activeTab === 'CUSTOM_PLANS' ? 'text-white' : 'text-slate-500'}`} />
          <span>Giáo Án Học Viên</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
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
          onClick={() => setActiveTab('TEMPLATES')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'TEMPLATES'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className={`h-4 w-4 ${activeTab === 'TEMPLATES' ? 'text-white' : 'text-slate-500'}`} />
          <span>Lộ Trình Mẫu (12 Buổi)</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
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
          onClick={() => setActiveTab('EXERCISE_LIBRARY')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeTab === 'EXERCISE_LIBRARY'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Dumbbell className={`h-4 w-4 ${activeTab === 'EXERCISE_LIBRARY' ? 'text-white' : 'text-slate-500'}`} />
          <span>Thư Viện Động Tác</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 ${
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
      {/* TAB 1: GIÁO ÁN HỌC VIÊN (CÁ NHÂN HÓA THEO THỂ LỰC)        */}
      {/* ========================================================= */}
      {activeTab === 'CUSTOM_PLANS' && (
        <div className="space-y-6">
          {/* Controls Filter Bar: Monochromatic Clean Slate */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Member selector */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Học viên:
                  </span>
                  <select
                    value={selectedStudentFilter}
                    onChange={(e) => setSelectedStudentFilter(e.target.value)}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="ALL">Tất cả học viên ({plans.length} giáo án)</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.user?.id || m.id}>
                        {m.user?.fullName || m.user?.email || 'Học viên PT'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date sort */}
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Xếp:
                  </span>
                  <select
                    value={dateSort}
                    onChange={(e) => setDateSort(e.target.value as 'DESC' | 'ASC')}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden"
                  >
                    <option value="DESC">Mới nhất trước</option>
                    <option value="ASC">Cũ nhất trước</option>
                  </select>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={customPlanSearch}
                  onChange={(e) => setCustomPlanSearch(e.target.value)}
                  placeholder="Tìm theo tiêu đề giáo án hoặc tên học viên..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden transition-all"
                />
                {customPlanSearch && (
                  <button
                    type="button"
                    onClick={() => setCustomPlanSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Loading */}
          {isLoadingPlans && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải danh sách giáo án học viên...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingPlans && filteredPlans.length === 0 && (
            <div className="py-16 text-center space-y-4 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
              <div className="h-16 w-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Chưa có giáo án tùy chỉnh nào
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Soạn giáo án mới cho học viên hoặc bấm "Dùng mẫu này" tại tab Lộ Trình Mẫu để sao chép nhanh bài tập.
                </p>
              </div>
              <Button
                onClick={() => {
                  resetForm();
                  setIsCreateOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 px-5 py-2.5 rounded-xl cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Soạn giáo án đầu tiên</span>
              </Button>
            </div>
          )}

          {/* Grid of Custom Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPlans.map((plan) => {
              const student = memberMap.get(plan.memberId);
              const studentName = student?.user?.fullName || student?.user?.email || 'Học viên PT';
              const studentInitial = studentName.charAt(0).toUpperCase();
              const totalSets = (plan.exercises || []).reduce((sum, e) => sum + (e.sets || 3), 0);

              return (
                <div
                  key={plan.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Top Row: Student info & Quick actions */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-2xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shrink-0 shadow-xs">
                          {studentInitial}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate">
                            {studentName}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {student?.user?.phone || 'Kèm riêng 1:1'} · Ngày tạo: {new Date(plan.createdAt).toLocaleDateString('vi-VN')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingPlan(plan)}
                          className="text-slate-700 dark:text-slate-200 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-800 h-8 px-2.5 gap-1.5 cursor-pointer rounded-xl font-bold text-xs"
                          title="Xem giáo án đầy đủ"
                        >
                       
                        
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditPlan(plan)}
                          className="text-slate-700 dark:text-slate-200 hover:text-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 h-8 px-2.5 gap-1.5 cursor-pointer rounded-xl font-bold text-xs"
                          title="Chỉnh sửa giáo án này"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-600" />
                          <span>Sửa</span>
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

                    {/* Plan Title & Metadata Badges */}
                    <div className="space-y-1.5">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-black uppercase">
                          {plan.exercises?.length || 0} bài tập
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          Tổng khối lượng: <strong className="text-slate-800 dark:text-slate-200">{totalSets}</strong> hiệp
                        </span>
                      </div>
                    </div>

                    {/* General Coach Note */}
                    {plan.notes && (
                      <div className="border-l-2 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 px-3.5 py-2.5 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        <strong className="text-emerald-800 dark:text-emerald-400 not-italic font-bold">Lời dặn của HLV:</strong> "{plan.notes}"
                      </div>
                    )}

                    {/* Exercise List preview (Style aligned with unified modal) */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        DANH SÁCH BÀI TẬP ({plan.exercises?.length || 0})
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {plan.exercises?.map((ex, idx) => {
                          const kItem = exerciseKnowledgeMap.get(ex.exerciseId);
                          const meta = parseExerciseInstructions(
                            kItem?.instructions || (ex.exercise as any)?.instructions
                          );
                          const { primary, secondary } = parseExerciseTitle(
                            ex.exercise?.title || kItem?.title
                          );
                          const unitStr = meta.unitVi || 'reps';

                          return (
                            <div
                              key={ex.id || idx}
                              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        ({secondary})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs block">
                                    {ex.sets || 3} hiệp × {ex.reps || 10} {unitStr}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {ex.weightKg && Number(ex.weightKg) > 0 ? `${ex.weightKg} kg · ` : 'Bodyweight · '}
                                    Nghỉ {ex.restSeconds || 60}s
                                  </span>
                                </div>
                              </div>

                              {ex.coachFeedback && (
                                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 italic pl-8">
                                  ↳ {ex.coachFeedback}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Bar */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-400">
                     
                    </span>

                    <button
                      type="button"
                      onClick={() => setViewingPlan(plan)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      
                      <span>Xem chi tiết giáo án</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: LỘ TRÌNH MẪU (12 BUỔI BOXING & YOGA)                */}
      {/* ========================================================= */}
      {activeTab === 'TEMPLATES' && (
        <div className="space-y-6">
          {/* Integrated Control Panel */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Discipline Switcher: Emerald & Slate */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('BOXING')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    templateDiscipline === 'BOXING'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Boxing (12 buổi)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateDiscipline('YOGA')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    templateDiscipline === 'YOGA'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Yoga (12 buổi)
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  placeholder="Tìm theo tên buổi học, bài tập kỹ thuật..."
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-9 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden transition-all"
                />
                {templateSearch && (
                  <button
                    type="button"
                    onClick={() => setTemplateSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Week Progression Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-100 pb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Giai đoạn:
              </span>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả tuần
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('1')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '1'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tuần 1 · Căn bản (Buổi 1-3)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('2')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '2'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tuần 2 · Nâng cao (Buổi 4-6)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('3')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '3'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tuần 3 · Cường độ (Buổi 7-9)
              </button>
              <button
                type="button"
                onClick={() => setTemplateWeekFilter('4')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  templateWeekFilter === '4'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Tuần 4 · Tổng hợp (Buổi 10-12)
              </button>
            </div>
          </div>

          {/* Loading */}
          {isLoadingTemplates && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải đề cương lộ trình chuẩn...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingTemplates && filteredTemplates.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
              <BookOpen className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Không tìm thấy buổi học phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thử chọn tuần khác hoặc tìm kiếm với từ khóa tổng quát hơn.
              </p>
            </div>
          )}

          {/* Grid of Templates */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTemplates.map((tpl) => {
              const isExpanded = expandedTemplateId === tpl.id;
              const totalSets = (tpl.exercises || []).reduce((sum, e) => sum + (e.sets || 3), 0);

              return (
                <div
                  key={tpl.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white">
                            {tpl.disciplineCode}
                          </span>
                          <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-0.5 text-[10px] font-black">
                            Tuần {tpl.weekNumber} · Buổi {tpl.sessionOrder}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-snug">
                          {tpl.title}
                        </h3>
                      </div>

                      <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold px-3 py-1 border border-slate-200 dark:border-slate-700 shrink-0">
                        {tpl.exercises?.length || 0} bài · {totalSets} hiệp
                      </span>
                    </div>

                    {/* Description Note Box */}
                    {tpl.description && (
                      <div className="border-l-2 border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 px-3.5 py-2.5 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{tpl.description}"
                      </div>
                    )}

                    {/* Exercises Timeline Sequence */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-500 uppercase tracking-wider">
                        <span>Động tác kỹ thuật ({tpl.exercises?.length || 0})</span>
                        <button
                          type="button"
                          onClick={() => setExpandedTemplateId(isExpanded ? null : tpl.id)}
                          className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
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

                      <div className="space-y-2">
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
                              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 p-3 text-xs space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        ({secondary})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <span className="rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                                  {translateCategory(ex.exercise?.category)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs pl-8">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200/80">
                                  {ex.sets || 3} hiệp × {ex.reps || 10} {unitStr}
                                </span>
                                {ex.weightKg !== null && ex.weightKg !== undefined && Number(ex.weightKg) > 0 && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    Tạ: {ex.weightKg} kg
                                  </span>
                                )}
                                <span className="text-slate-500 font-medium">
                                  Nghỉ {ex.restSeconds || 60}s
                                </span>
                                {meta.muscleVi && (
                                  <span className="text-slate-500 font-medium ml-1">
                                    • Cơ chính: {meta.muscleVi}
                                  </span>
                                )}
                              </div>

                              {(isExpanded || (tpl.exercises && tpl.exercises.length <= 2)) && meta.instructionsText && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed ml-8">
                                  <strong className="text-slate-800 dark:text-slate-100">Kỹ thuật:</strong> {meta.instructionsText}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setViewingTemplate(tpl)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                    >
                    
    
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCloneTemplateToPlan(tpl)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                 
                      <span>Dùng mẫu này </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: THƯ VIỆN ĐỘNG TÁC                                 */}
      {/* ========================================================= */}
      {activeTab === 'EXERCISE_LIBRARY' && (
        <div className="space-y-6">
          {/* Integrated Control Bar */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Discipline Segmented Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tất cả môn ({disciplineCounts.ALL})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline('BOXING')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'BOXING'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Boxing ({disciplineCounts.BOXING})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline('YOGA')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'YOGA'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Yoga ({disciplineCounts.YOGA})
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDiscipline('GYM')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                    selectedExerciseDiscipline === 'GYM'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Gym ({disciplineCounts.GYM})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  placeholder="Tra cứu bài tập, nhóm cơ chính, thiết bị..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden transition-all"
                />
                {exerciseSearch && (
                  <button
                    type="button"
                    onClick={() => setExerciseSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter Pills (Dynamically matched to selected discipline) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
                Nhóm bài:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả nhóm ({disciplineCounts[selectedExerciseDiscipline]})
              </button>
              {exerciseCategories.map(({ cat, count }) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {translateCategory(cat)} ({count})
                </button>
              ))}
            </div>

            {/* Filter Stats */}
            <div className="flex items-center justify-between text-xs pt-1 text-slate-500">
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
                  className="text-slate-900 dark:text-slate-100 font-bold hover:underline cursor-pointer"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>

          {/* Loading */}
          {isLoadingExercises && (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Đang tải thư viện bài tập...</p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingExercises && filteredExercises.length === 0 && (
            <div className="py-16 text-center space-y-3 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 p-8">
              <Dumbbell className="h-10 w-10 text-slate-400 mx-auto" />
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Không tìm thấy bài tập phù hợp</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Thử chọn nhóm cơ khác hoặc tìm kiếm với từ khóa rộng hơn.
              </p>
            </div>
          )}

          {/* Exercise Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((ex) => {
              const meta = parseExerciseInstructions(ex.instructions);
              const { primary, secondary } = parseExerciseTitle(ex.title);

              return (
                <div
                  key={ex.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Title & Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
                            {primary}
                          </h4>
                          {secondary && (
                            <span className="text-xs text-slate-400 dark:text-slate-500 truncate block mt-0.5 font-medium">
                              {secondary}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {meta.discipline && (
                            <span className="rounded-lg bg-emerald-600 text-white px-2 py-0.5 text-[10px] font-black uppercase">
                              {meta.discipline}
                            </span>
                          )}
                          <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                            {translateCategory(ex.category)}
                          </span>
                        </div>
                      </div>

                      {/* 3-Column Specification Tiles */}
                      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-bold uppercase">
                            <Target className="w-3 h-3 text-emerald-600 shrink-0" />
                            Cơ chính
                          </span>
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {meta.muscleVi}
                          </p>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-bold uppercase">
                            <Dumbbell className="w-3 h-3 text-emerald-600 shrink-0" />
                            Thiết bị
                          </span>
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {meta.equipmentVi}
                          </p>
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 font-bold uppercase">
                            <Timer className="w-3 h-3 text-emerald-600 shrink-0" />
                            Đơn vị
                          </span>
                          <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {meta.unitVi}
                          </p>
                        </div>
                      </div>

                      {/* Technical Guidance */}
                      {meta.instructionsText ? (
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic line-clamp-3">
                          "{meta.instructionsText}"
                        </div>
                      ) : null}
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          handleAddExerciseToForm(ex);
                          setIsCreateOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs active:scale-[0.98] cursor-pointer group"
                      >
                        <Plus className="w-4 h-4 text-white" />
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
      {/* UNIFIED WORKOUT PLAN DETAIL MODAL (Matching User Image)   */}
      {/* ========================================================= */}
      <WorkoutPlanDetailModal
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        title={viewingPlan?.title}
        coachName={user?.fullName || 'Huấn luyện viên phụ trách'}
        notes={viewingPlan?.notes}
        exercises={viewingPlan?.exercises as any}
      />

      <WorkoutPlanDetailModal
        isOpen={!!viewingTemplate}
        onClose={() => setViewingTemplate(null)}
        title={viewingTemplate?.title}
        coachName={`Lộ trình mẫu chuẩn · ${viewingTemplate?.disciplineCode}`}
        notes={viewingTemplate?.description}
        exercises={viewingTemplate?.exercises as any}
      />

      {/* ========================================================= */}
      {/* MODAL: SOẠN & HIỆU CHỈNH GIÁO ÁN HỌC VIÊN                 */}
      {/* ========================================================= */}
      {isCreateOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/70 backdrop-blur-xs p-3 sm:p-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-6xl my-auto rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header: Clean light header with emerald accent */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 bg-slate-50 text-slate-900 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                  {editingPlanId ? <Pencil className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 leading-tight truncate">
                      {editingPlanId ? 'Chỉnh Sửa Giáo Án Học Viên' : 'Soạn Giáo Án Huấn Luyện Mới'}
                    </h3>
                    {editingPlanId && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                        Đang chỉnh sửa
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                    {editingPlanId
                      ? 'Cập nhật lại danh sách bài tập, số hiệp, khối lượng tạ và dặn dò HLV cho học viên'
                      : 'Chọn động tác từ kho bài tập chuẩn và cá nhân hóa khối lượng tập luyện cho học viên'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Split 2-Column Studio */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-5 bg-white dark:bg-slate-900">
              {formError && (
                <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* ========================================================= */}
                {/* LEFT COLUMN: KHO BÀI TẬP (7 COLS)                        */}
                {/* ========================================================= */}
                <div className="lg:col-span-7 flex flex-col space-y-3.5 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                  {/* Header of Picker */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                        Kho Động Tác Chuẩn
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Tìm và thêm bài tập vào giáo án bên phải
                      </p>
                    </div>

                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                      Đã chọn: <strong>{exercisesList.length}</strong> bài
                    </span>
                  </div>

                  {/* Filter controls */}
                  <div className="space-y-2.5">
                    {/* Search */}
                    <div className="relative w-full">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        value={formExerciseSearch}
                        onChange={(e) => setFormExerciseSearch(e.target.value)}
                        placeholder="Tìm theo tên động tác, nhóm cơ chính..."
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden transition-all shadow-sm"
                      />
                      {formExerciseSearch && (
                        <button
                          type="button"
                          onClick={() => setFormExerciseSearch('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Disciplines Filter */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSelectFormDiscipline('ALL')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          formDisciplineFilter === 'ALL'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tất cả ({disciplineCounts.ALL})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFormDiscipline('BOXING')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          formDisciplineFilter === 'BOXING'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Boxing ({disciplineCounts.BOXING})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFormDiscipline('YOGA')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          formDisciplineFilter === 'YOGA'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Yoga ({disciplineCounts.YOGA})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectFormDiscipline('GYM')}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          formDisciplineFilter === 'GYM'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Gym ({disciplineCounts.GYM})
                      </button>
                    </div>

                    {/* Categories Filter (Dynamically matched to form discipline) */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1.5 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setFormCategoryFilter('ALL')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                          formCategoryFilter === 'ALL'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Tất cả nhóm ({disciplineCounts[formDisciplineFilter]})
                      </button>
                      {modalExerciseCategories.map(({ cat, count }) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormCategoryFilter(cat)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                            formCategoryFilter.toLowerCase() === cat.toLowerCase()
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {translateCategory(cat)} ({count})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Exercise Picker Cards Grid */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1">
                    {modalFilteredExercises.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs text-slate-400 space-y-2">
                        <Dumbbell className="h-8 w-8 text-slate-300 mx-auto" />
                        <p>Không có bài tập nào phù hợp với bộ lọc tìm kiếm.</p>
                      </div>
                    ) : (
                      modalFilteredExercises.map((item) => {
                        const isAdded = exercisesList.some((e) => e.exerciseId === item.id);
                        const meta = parseExerciseInstructions(item.instructions);
                        const { primary, secondary } = parseExerciseTitle(item.title);

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isAdded
                                ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-400 shadow-xs'
                            }`}
                          >
                            <div className="space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  {meta.discipline && (
                                    <span className="rounded-md bg-emerald-600 text-white px-1.5 py-0.5 text-[9px] font-black uppercase shrink-0">
                                      {meta.discipline}
                                    </span>
                                  )}
                                  <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 text-[9px] font-bold truncate">
                                    {translateCategory(item.category)}
                                  </span>
                                </div>

                                {isAdded ? (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveExerciseFromForm(item.id)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-rose-600 text-white text-[10px] font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer group"
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
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3 text-white" />
                                    <span>Thêm</span>
                                  </button>
                                )}
                              </div>

                              <div className="min-w-0">
                                <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate leading-snug">
                                  {primary}
                                </h5>
                                {secondary && (
                                  <p className="text-[10px] font-medium text-slate-400 truncate">
                                    {secondary}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 min-w-0 font-medium">
                              <span className="truncate flex-1 min-w-0"> {meta.muscleVi}</span>
                              <span className="truncate flex-1 min-w-0 text-right"> {meta.equipmentVi}</span>
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
                  <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-900 dark:text-slate-100">
                          Học viên nhận giáo án <span className="text-emerald-600">*</span>
                        </label>
                        {editingPlanId && (
                          <span className="text-[10px] font-semibold text-slate-400 italic">
                            (Cố định khi chỉnh sửa)
                          </span>
                        )}
                      </div>
                      <select
                        value={targetMemberId}
                        onChange={(e) => {
                          setTargetMemberId(e.target.value);
                          setRecommendationHidden(false);
                        }}
                        disabled={!!editingPlanId}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden disabled:opacity-75 disabled:cursor-not-allowed"
                      >
                        <option value="">-- Chọn học viên nhận giáo án --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.user?.id || m.id}>
                            {m.user?.fullName || m.user?.email || 'Học viên PT'}
                          </option>
                        ))}
                      </select>
                    </div>

                    {targetMemberId && !editingPlanId && !recommendationHidden && (
                      <InbodyRecommendationCard
                        memberId={targetMemberId}
                        onApply={handleApplyRecommendation}
                        onDismiss={() => setRecommendationHidden(true)}
                      />
                    )}

                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-900 dark:text-slate-100">
                        Tiêu đề giáo án <span className="text-emerald-600">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ví dụ: Giáo án tăng cơ ngực - lưng cho tuần 2"
                        value={planTitle}
                        onChange={(e) => setPlanTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Lời dặn của HLV (Tùy chọn)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Dặn dò về khởi động, nhịp thở, nghỉ ngơi, dinh dưỡng..."
                        value={planNotes}
                        onChange={(e) => setPlanNotes(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-emerald-600 focus:outline-hidden resize-none"
                      />
                    </div>
                  </div>

                  {/* Configured Exercises in Plan */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Cấu Hình Bài Tập ({exercisesList.length})
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        {exercisesList.length > 0 ? 'Hiệp, lần, tạ và thời gian nghỉ' : ''}
                      </span>
                    </div>

                    {exercisesList.length === 0 ? (
                      <div className="p-8 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20 text-center space-y-2">
                        <Dumbbell className="h-8 w-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Chưa có bài tập nào trong giáo án
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                          Bấm nút "+ Thêm" ở kho bài tập bên trái để đưa bài tập vào giáo án này.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                        {exercisesList.map((item, idx) => {
                          const { primary, secondary } = parseExerciseTitle(item.title);
                          return (
                            <div
                              key={item.exerciseId}
                              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 space-y-3 shadow-xs"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-black text-xs flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate block">
                                      {primary}
                                    </span>
                                    {secondary && (
                                      <span className="text-[10px] text-slate-400 truncate block">
                                        ({secondary})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveExerciseFromForm(item.exerciseId)}
                                  className="text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer shrink-0 p-1 rounded-lg hover:bg-rose-50"
                                  title="Xóa động tác này"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-4 gap-2">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block text-center">
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
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-black text-slate-900 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block text-center">
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
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-black text-slate-900 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block text-center">
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
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-black text-slate-900 dark:text-slate-100 text-center"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-500 uppercase block text-center">
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
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs font-black text-slate-900 dark:text-slate-100 text-center"
                                  />
                                </div>
                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="Lời dặn HLV cho bài tập này..."
                                  value={item.coachFeedback || ''}
                                  onChange={(e) =>
                                    handleUpdateExerciseParam(idx, 'coachFeedback', e.target.value)
                                  }
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
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
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4 shrink-0">
              <div className="text-xs text-slate-600 font-medium">
                {exercisesList.length > 0 ? (
                  <span>
                    Giáo án gồm <strong className="text-slate-900 font-black">{exercisesList.length}</strong> bài tập
                  </span>
                ) : (
                  <span>Chưa chọn bài tập</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    resetForm();
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs font-bold cursor-pointer rounded-xl h-10 px-4 border-slate-300 dark:border-slate-700"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={() => (editingPlanId ? updateMutation.mutate() : createMutation.mutate())}
                  disabled={createMutation.isPending || updateMutation.isPending || exercisesList.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2 disabled:opacity-50 cursor-pointer shadow-md rounded-xl h-10 px-5 active:scale-[0.98]"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {editingPlanId
                      ? `Lưu cập nhật (${exercisesList.length} bài)`
                      : `Ban hành giáo án (${exercisesList.length} bài)`}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
