import React, { useState } from "react";
import {
  MembershipPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
  DisciplineType,
  PlanTier,
} from "../types";
import { INITIAL_PLANS, DISCIPLINES } from "../mock-data";
import { PlanStatsSummary } from "../components/plan-stats-summary";
import { PlanListTable } from "../components/plan-list-table";
import { CreatePlanModal } from "../components/create-plan-modal";
import { EditPlanModal } from "../components/edit-plan-modal";
import { DeactivatePlanDialog } from "../components/deactivate-plan-dialog";
import { Button } from "@/components/ui/button";
import { Search, Plus, CheckCircle2, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export const MembershipPlanManagementPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlan[]>(INITIAL_PLANS);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<string>("ALL");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [deactivatingPlan, setDeactivatingPlan] = useState<MembershipPlan | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 1. Tạo gói mới (POST)
  const handleCreatePlan = (payload: CreatePlanPayload) => {
    const discObj = DISCIPLINES.find((d) => d.code === payload.discipline);
    const tierLabels: Record<PlanTier, string> = {
      TRIAL: "Dùng Thử",
      DROP_IN: "Theo Lượt",
      PLUS: "Nâng Cao",
      VIP: "Đặc Quyền VIP",
    };

    const newPlan: MembershipPlan = {
      id: `plan-${Date.now()}`,
      code: payload.code,
      name: payload.name,
      discipline: payload.discipline,
      disciplineName: discObj ? discObj.name : payload.discipline,
      tier: payload.tier,
      tierLabel: tierLabels[payload.tier],
      price: payload.price,
      durationDays: payload.durationDays,
      groupClassQuota: payload.discipline === "GYM" ? 0 : payload.groupClassQuota,
      ptSessionQuota: payload.ptSessionQuota,
      isActive: true,
      description: payload.description,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setPlans((prev) => [newPlan, ...prev]);
    showToast(`Đã tạo thành công gói tập mới: "${newPlan.name}" (${newPlan.code})!`);
  };

  // 2. Sửa gói cước (PUT)
  const handleUpdatePlan = (payload: UpdatePlanPayload) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === payload.id
          ? {
              ...p,
              name: payload.name,
              price: payload.price,
              durationDays: payload.durationDays,
              groupClassQuota: p.discipline === "GYM" ? 0 : payload.groupClassQuota,
              ptSessionQuota: payload.ptSessionQuota,
              description: payload.description,
            }
          : p
      )
    );
    showToast(`Đã cập nhật thông tin và định mức gói cước thành công!`);
  };

  // 3. Ngừng kinh doanh (DELETE - Soft Delete: is_active = FALSE)
  const handleDeactivatePlan = (planId: string, reason: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, isActive: false } : p))
    );
    const planName = plans.find((p) => p.id === planId)?.name;
    showToast(`Đã ngừng kinh doanh gói "${planName}". Dữ liệu hợp đồng cũ vẫn được bảo toàn.`);
  };

  // 4. Mở bán lại gói cước
  const handleReactivatePlan = (plan: MembershipPlan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, isActive: true } : p))
    );
    showToast(`Đã kích hoạt mở bán lại gói cước "${plan.name}"!`);
  };

  // Filter plans
  const filteredPlans = plans.filter((p) => {
    if (disciplineFilter !== "ALL" && p.discipline !== disciplineFilter) return false;
    if (tierFilter !== "ALL" && p.tier !== tierFilter) return false;
    if (statusFilter === "ACTIVE" && !p.isActive) return false;
    if (statusFilter === "INACTIVE" && p.isActive) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.disciplineName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate KPIs
  const activePlans = plans.filter((p) => p.isActive);
  const inactivePlans = plans.filter((p) => !p.isActive);
  const gymCount = activePlans.filter((p) => p.discipline === "GYM").length;
  const boxingCount = activePlans.filter((p) => p.discipline === "BOXING").length;
  const yogaCount = activePlans.filter((p) => p.discipline === "YOGA").length;
  const dancingCount = activePlans.filter((p) => p.discipline === "DANCING").length;
  const avgPrice = activePlans.length
    ? Math.round(activePlans.reduce((sum, p) => sum + p.price, 0) / activePlans.length)
    : 0;

  return (
    <div className="space-y-7 pb-12 w-full max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3 text-xs font-semibold text-white shadow-2xl animate-in slide-in-from-top-3">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md bg-[#e6f7f2] px-2 py-0.5 text-[10px] font-bold text-[#008b74] tracking-wide uppercase">
              CENTER_MANAGER
            </span>
            <span className="text-xs text-slate-400">
              Quản lý danh mục gói cước &amp; Ràng buộc 4 môn tập
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Cấu Hình Gói Tập 
          </h2>
          <p className="text-xs text-slate-500">
            Thiết lập danh mục gói Gym, Boxing, Yoga, Dancing; quản lý định mức quota và trigger DB chống sai sót
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="mint"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Tạo gói cước mới (POST)
          </Button>
        </div>
      </div>

      {/* 1. Summary Metrics */}
      <PlanStatsSummary
        totalActivePlans={activePlans.length}
        gymCount={gymCount}
        boxingCount={boxingCount}
        yogaCount={yogaCount}
        dancingCount={dancingCount}
        avgPrice={avgPrice}
        inactiveCount={inactivePlans.length}
      />

      {/* 2. Filter & Search Toolbar */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên gói, mã gói..."
            className="w-full rounded-xl border border-slate-200 bg-[#f8fafc] py-2 pl-9 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#008b74] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#008b74]"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Discipline Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[10px] text-slate-400 px-1 font-semibold uppercase">Bộ môn:</span>
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "GYM", label: "Gym" },
              { id: "BOXING", label: "Boxing" },
              { id: "YOGA", label: "Yoga" },
              { id: "DANCING", label: "Dancing" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDisciplineFilter(f.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 font-semibold transition-all select-none text-[11px]",
                  disciplineFilter === f.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: "ALL", label: "Tất cả hạng" },
              { id: "TRIAL", label: "Dùng thử" },
              { id: "DROP_IN", label: "Theo lượt" },
              { id: "PLUS", label: "Plus" },
              { id: "VIP", label: "VIP" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTierFilter(t.id)}
                className={cn(
                  "rounded-lg px-2 py-1 font-semibold transition-all select-none text-[11px]",
                  tierFilter === t.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "ACTIVE", label: "Mở bán" },
              { id: "INACTIVE", label: "Đã đóng" },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStatusFilter(s.id)}
                className={cn(
                  "rounded-lg px-2 py-1 font-semibold transition-all select-none text-[11px]",
                  statusFilter === s.id
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Master Plans List Table */}
      <PlanListTable
        plans={filteredPlans}
        onEditPlan={(plan) => setEditingPlan(plan)}
        onDeactivatePlan={(plan) => setDeactivatingPlan(plan)}
        onReactivatePlan={handleReactivatePlan}
      />

      {/* Modal 1: Tạo gói mới (POST - Kèm kiểm tra Trigger DB Chặn Gym lớp nhóm) */}
      <CreatePlanModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePlan}
      />

      {/* Modal 2: Sửa gói cước (PUT) */}
      <EditPlanModal
        plan={editingPlan}
        open={!!editingPlan}
        onClose={() => setEditingPlan(null)}
        onSubmit={handleUpdatePlan}
      />

      {/* Dialog 3: Ngừng kinh doanh gói (DELETE - Soft-delete is_active = FALSE) */}
      <DeactivatePlanDialog
        plan={deactivatingPlan}
        open={!!deactivatingPlan}
        onClose={() => setDeactivatingPlan(null)}
        onConfirmDeactivate={handleDeactivatePlan}
      />
    </div>
  );
};
