import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { coachPortalApi } from '../api/coach-portal-api';
import type { WorkoutExerciseDto } from '../types/coach-portal.types';

export const CoachWorkoutPlansPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Form states for creating a new plan
  const [targetMemberId, setTargetMemberId] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('');
  const [planNotes, setPlanNotes] = useState<string>('');
  const [exercisesList, setExercisesList] = useState<
    Array<WorkoutExerciseDto & { title?: string; category?: string }>
  >([]);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const {
    data: plans = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['coach', 'workout-plans'],
    queryFn: () => coachPortalApi.getWorkoutPlans(),
  });

  const { data: exercisesKnowledge = [] } = useQuery({
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

  const handleAddExercise = (item: { id: string; title: string; category: string }) => {
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

  const handleRemoveExercise = (exerciseId: string) => {
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

  const filteredPlans = plans.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Giáo Án Tập Luyện
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thiết lập kế hoạch tập luyện cá nhân hóa, lựa chọn bài tập từ thư viện chuẩn
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={() => void refetch()}
            disabled={isLoading || isRefetching}
            className="text-xs font-bold border-slate-200 bg-white shadow-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
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

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm giáo án theo tiêu đề..."
          className="w-full rounded-2xl border border-slate-200/90 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 shadow-xs focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="py-20 text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Đang tải danh sách giáo án...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredPlans.length === 0 && (
        <div className="py-16 text-center space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Chưa có giáo án nào</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Bạn chưa tạo giáo án nào cho học viên. Hãy bấm nút "Soạn giáo án mới" phía trên để bắt đầu.
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
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 text-xs font-semibold"
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

      {/* Modal / Drawer Tạo Giáo Án Mới */}
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
                    Chọn học viên và chọn bài tập từ thư viện exercise knowledge
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                type="button"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {formError && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Step 1: Member & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Học viên nhận giáo án <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={targetMemberId}
                    onChange={(e) => setTargetMemberId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Chọn học viên --</option>
                    {members.map((m) => {
                      const u = m?.user || ({} as any);
                      const id = u.id || m.id;
                      const name = u.fullName || 'Học viên';
                      const contact = u.phone || u.email || 'VIP';
                      return (
                        <option key={id} value={id}>
                          {name} ({contact})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu đề giáo án <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Giáo án Tăng cơ Giảm mỡ Tuần 1-4"
                    value={planTitle}
                    onChange={(e) => setPlanTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ghi chú tổng quan giáo án
                </label>
                <textarea
                  value={planNotes}
                  onChange={(e) => setPlanNotes(e.target.value)}
                  placeholder="Mục tiêu giáo án, lưu ý khởi động kỹ trước khi tập..."
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              {/* Step 2: Exercise Knowledge Selector */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-600" />
                    Thư viện bài tập chuẩn (Exercise Knowledge)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Bấm bài tập bên dưới để thêm vào giáo án
                  </span>
                </div>

                <input
                  type="text"
                  placeholder="Tìm kiếm bài tập trong thư viện..."
                  value={exerciseSearch}
                  onChange={(e) => setExerciseSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden"
                />

                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-50 border border-slate-100">
                  {exercisesKnowledge
                    .filter((ex) =>
                      ex.title.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                      ex.category.toLowerCase().includes(exerciseSearch.toLowerCase())
                    )
                    .map((ex) => {
                      const isAdded = exercisesList.some((e) => e.exerciseId === ex.id);
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          onClick={() => handleAddExercise(ex)}
                          disabled={isAdded}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition-all ${
                            isAdded
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-800 opacity-60 cursor-not-allowed'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-500 hover:bg-emerald-50'
                          }`}
                        >
                          + {ex.title} ({ex.category})
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Step 3: Selected Exercises Configuration */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Các bài tập đã chọn trong giáo án ({exercisesList.length})
                </h4>

                {exercisesList.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center rounded-xl border border-dashed border-slate-200">
                    Chưa chọn bài tập nào. Hãy bấm các bài tập phía trên để thêm.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {exercisesList.map((item, idx) => (
                      <div
                        key={item.exerciseId}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2.5 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-900">
                            {idx + 1}. {item.title || 'Bài tập'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(item.exerciseId)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-semibold p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Số hiệp (Sets)</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={item.sets}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'sets', parseInt(e.target.value, 10))
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Số lần (Reps)</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={item.reps}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'reps', parseInt(e.target.value, 10))
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Tạ (kg)</span>
                            <input
                              type="number"
                              min="0"
                              max="500"
                              value={item.weightKg}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'weightKg', parseFloat(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block">Nghỉ (giây)</span>
                            <input
                              type="number"
                              min="0"
                              max="300"
                              value={item.restSeconds}
                              onChange={(e) =>
                                handleUpdateExerciseParam(idx, 'restSeconds', parseInt(e.target.value, 10))
                              }
                              className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-800"
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
                className="text-xs font-semibold"
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || exercisesList.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-1.5 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Lưu & Ban hành giáo án</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
