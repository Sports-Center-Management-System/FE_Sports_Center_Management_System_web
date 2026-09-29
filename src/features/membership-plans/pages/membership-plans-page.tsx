import React, { useEffect, useState, useMemo } from "react";
import {
  Dumbbell,
  ShieldCheck,
  Award,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
} from "lucide-react";
import { MembershipPlan, Discipline, PackageTier } from "../types/plans.types";
import {
  getMembershipPlansApi,
  getDisciplinesApi,
} from "../services/plans-api.service";
import { PlanFilter } from "../components/plan-filter";
import { PlanCard } from "../components/plan-card";
import { PlanDetailModal } from "../components/plan-detail-modal";
import { PlanComparisonTable } from "../components/plan-comparison-table";

export const MembershipPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDisciplineId, setSelectedDisciplineId] = useState<string>("ALL");
  const [selectedTier, setSelectedTier] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal
  const [selectedPlanForModal, setSelectedPlanForModal] =
    useState<MembershipPlan | null>(null);

  // Fetch data from real backend endpoints
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel fetch disciplines and plans
      const [fetchedDisciplines, fetchedPlans] = await Promise.all([
        getDisciplinesApi().catch(() => [] as Discipline[]),
        getMembershipPlansApi({
          disciplineId: selectedDisciplineId !== "ALL" ? selectedDisciplineId : undefined,
          packageTier:
            selectedTier !== "ALL" ? (selectedTier as PackageTier) : undefined,
        }),
      ]);

      setDisciplines(fetchedDisciplines);
      setPlans(fetchedPlans);
    } catch (err: unknown) {
      console.error("Failed to load membership plans:", err);
      setError(
        "Không thể kết nối đến máy chủ để tải danh sách gói tập. Vui lòng kiểm tra lại dịch vụ Backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisciplineId, selectedTier]);

  // Client-side search filtering
  const filteredPlans = useMemo(() => {
    if (!searchQuery.trim()) return plans;
    const q = searchQuery.toLowerCase().trim();
    return plans.filter((plan) => {
      const matchName = plan.name.toLowerCase().includes(q);
      const matchDesc = plan.description?.toLowerCase().includes(q) ?? false;
      const matchDiscipline =
        plan.discipline?.name.toLowerCase().includes(q) ?? false;
      const matchTier = plan.packageTier.toLowerCase().includes(q);
      return matchName || matchDesc || matchDiscipline || matchTier;
    });
  }, [plans, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008b74] to-[#005a4b] flex items-center justify-center text-white shadow-sm shadow-[#008b74]/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                Dao mẻ WDP
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                Hệ thống Quản lý Trung tâm Thể thao
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới dữ liệu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white via-white to-slate-50/50 border-b border-slate-200/60 pt-10 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#008b74] border border-emerald-200 mb-3">
              <Award className="w-3.5 h-3.5" />
              <span>Chương trình Hội viên & Gói tập Thể thao</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Danh sách Gói tập & Quyền lợi Hội viên
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
              Tra cứu biểu phí, thời hạn hiệu lực, số buổi tập luyện, quyền vào cửa phòng Gym và chính sách Huấn luyện viên chuyên môn (Coach) minh bạch từ hệ thống.
            </p>
          </div>

          {/* Key highlights box */}
          <div className="mt-6 sm:mt-0 flex flex-row sm:flex-col gap-2 shrink-0 justify-center">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-[#008b74]" />
              <span>Dữ liệu niêm yết chính thức</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs text-slate-700">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Chính sách Coach 1:1 & Lớp nhóm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Filter Controls */}
        <PlanFilter
          disciplines={disciplines}
          selectedDisciplineId={selectedDisciplineId}
          onSelectDiscipline={setSelectedDisciplineId}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          totalCount={filteredPlans.length}
        />

        {/* Error Alert */}
        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-7 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-8 bg-slate-200 rounded w-1/2 mt-4" />
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <div className="h-4 bg-slate-100 rounded w-full" />
                  <div className="h-4 bg-slate-100 rounded w-5/6" />
                  <div className="h-4 bg-slate-100 rounded w-4/6" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty Result */}
        {!loading && filteredPlans.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Không tìm thấy gói tập phù hợp
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Không có gói tập nào thỏa mãn điều kiện lọc hiện tại. Vui lòng chọn lại bộ môn hoặc phân hạng.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedDisciplineId("ALL");
                setSelectedTier("ALL");
                setSearchQuery("");
              }}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </div>
        )}

        {/* Plan Cards Grid */}
        {!loading && filteredPlans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={(selected) => setSelectedPlanForModal(selected)}
              />
            ))}
          </div>
        )}

        {/* Comparison Table */}
        {!loading && plans.length > 0 && (
          <PlanComparisonTable
            plans={plans}
            onSelect={(selected) => setSelectedPlanForModal(selected)}
          />
        )}

        {/* FAQ & Policy Notes */}
        <section className="mt-12 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#008b74]" />
            <h3 className="text-base font-bold text-slate-900">
              Câu hỏi thường gặp về gói tập & quyền lợi hội viên
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                1. Gói tập VIP khác gì so với gói Tiêu chuẩn (Plus)?
              </h4>
              <p className="leading-relaxed">
                Gói VIP tích hợp kèm 12 buổi huấn luyện 1:1 cùng Huấn luyện viên chuyên môn cá nhân, kết hợp cùng 15 buổi học nhóm và quyền ra vào phòng tập gym không giới hạn số lượt.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                2. Tôi có thể đăng ký gói tập dùng thử (Trial) nhiều lần không?
              </h4>
              <p className="leading-relaxed">
                Mỗi tài khoản hội viên chỉ được kích hoạt một lần gói trải nghiệm thử (Free Trial) theo quy định chính sách kích hoạt trên hệ thống của trung tâm.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                3. Chính sách bảo lưu và đóng băng gói tập hoạt động thế nào?
              </h4>
              <p className="leading-relaxed">
                Hội viên có nhu cầu tạm dừng do lý do y tế hoặc công tác có thể thông báo cho lễ tân để được kích hoạt trạng thái Đóng băng (Frozen) và cộng dồn lại thời hạn sử dụng.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                4. Làm sao để đăng ký gói tập sau khi xem thông tin?
              </h4>
              <p className="leading-relaxed">
                Quý hội viên có thể trực tiếp đến quầy Lễ tân của trung tâm để hoàn tất thủ tục và thanh toán bằng chuyển khoản hoặc tiền mặt.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Plan Detail Modal */}
      <PlanDetailModal
        plan={selectedPlanForModal}
        onClose={() => setSelectedPlanForModal(null)}
      />
    </div>
  );
};
