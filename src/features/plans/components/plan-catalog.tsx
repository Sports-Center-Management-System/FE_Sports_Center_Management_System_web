import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import { memberKeys } from "@/lib/keys";
import type { Discipline, Plan } from "@/lib/types";
import { Dumbbell, Flame, Sparkles, Music, Activity, LayoutGrid, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

function getDisciplineIcon(nameOrCode?: string) {
  if (!nameOrCode) return Activity;
  const lower = nameOrCode.toLowerCase();
  if (lower.includes("gym") || lower.includes("fitness")) return Dumbbell;
  if (lower.includes("box") || lower.includes("combat") || lower.includes("võ")) return Flame;
  if (
    lower.includes("yoga") ||
    lower.includes("mind") ||
    lower.includes("thiền") ||
    lower.includes("meditation")
  )
    return Sparkles;
  if (lower.includes("dance") || lower.includes("zumba") || lower.includes("nhảy")) return Music;
  return Activity;
}

const defaultDisciplines: Discipline[] = [
  { id: "gym", name: "Gym & Fitness", code: "GYM" },
  { id: "boxing", name: "Boxing & Combat", code: "BOXING" },
  { id: "yoga", name: "Yoga & Meditation", code: "YOGA" },
  { id: "zumba", name: "Zumba & Dance", code: "ZUMBA" },
];

const tierOptions = [
  { value: "", label: "Tất cả gói" },
  { value: "TRIAL", label: "Trải nghiệm (Trial)" },
  { value: "DROP_IN", label: "Vé ngày (Drop-in)" },
  { value: "PLUS", label: "Tiêu chuẩn PLUS" },
  { value: "VIP", label: "VIP Hội viên" },
];

export interface PlanCatalogProps {
  member: boolean;
}

export const PlanCatalog: React.FC<PlanCatalogProps> = ({ member }) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [disciplineId, setDisciplineId] = useState("");
  const [tier, setTier] = useState("");
  const [actionError, setActionError] = useState("");

  const disciplines = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => get<Discipline[]>("/disciplines", true),
  });

  // Ensure standard 4 disciplines + "Tất cả" = 5 tabs
  const tabDisciplines: Discipline[] = React.useMemo(() => {
    if (!disciplines.data || disciplines.data.length === 0) {
      return defaultDisciplines;
    }
    if (disciplines.data.length >= 4) {
      return disciplines.data;
    }
    const apiIds = new Set(disciplines.data.map((d) => d.id));
    const merged = [...disciplines.data];
    for (const def of defaultDisciplines) {
      if (!apiIds.has(def.id)) {
        merged.push(def);
      }
    }
    return merged.slice(0, 4);
  }, [disciplines.data]);

  const plans = useQuery({
    queryKey: memberKeys.catalog(disciplineId, tier),
    queryFn: () =>
      get<Plan[]>(`/memberships/plans${query({ disciplineId, packageTier: tier })}`, true),
  });

  const order = useMutation({
    mutationFn: (plan: Plan) =>
      createCheckout(user!.id, { kind: "NEW_SUBSCRIPTION", planId: plan.id }),
    onSuccess: (value) => navigate(`/portal/member/checkouts/${value.checkoutId}`),
    onError: (error) => setActionError(errorText(error)),
  });

  function choose(plan: Plan) {
    if (!user || user.role !== "MEMBER") {
      navigate("/auth/login", { state: { from: "/portal/member/plans" } });
      return;
    }
    if (plan.packageTier === "VIP") {
      navigate(`/portal/member/quotations?planId=${plan.id}`);
      return;
    }
    setActionError("");
    order.mutate(plan);
  }

  return (
    <>
      <PageTitle
        eyebrow={member ? "MEM-02 · DANH MỤC" : "KHÁM PHÁ"}
        title="Chọn gói tập phù hợp"
      />

      {/* Web Browser-styled Tab Strip & Action Toolbar */}
      <div className="mb-6">
        {/* Browser Top Chrome Tab Bar */}
        <div className="flex items-end gap-1 px-2.5 pt-2.5 bg-slate-200/70 border border-slate-300/80 rounded-t-2xl overflow-x-auto select-none border-b-0 shadow-inner">
          {/* Tab 1: Tất cả môn */}
          <button
            type="button"
            onClick={() => setDisciplineId("")}
            className={cn(
              "group relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all duration-150 cursor-pointer border border-b-0 whitespace-nowrap",
              !disciplineId
                ? "bg-white text-[#008b74] border-slate-300/80 shadow-xs z-10 -mb-[1px]"
                : "bg-slate-200/40 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {!disciplineId && (
              <span className="absolute top-0 left-3 right-3 h-[2.5px] bg-[#008b74] rounded-full" />
            )}
            <LayoutGrid
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                !disciplineId ? "text-[#008b74]" : "text-slate-400 group-hover:text-slate-600"
              )}
            />
            <span>Tất cả môn</span>
            {!disciplineId ? (
              <span className="h-1.5 w-1.5 rounded-full bg-[#008b74] shrink-0" />
            ) : null}
          </button>

          {/* Tabs 2..5: 4 Disciplines */}
          {tabDisciplines.map((item) => {
            const isActive = disciplineId === item.id;
            const Icon = getDisciplineIcon(item.name || item.code || item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setDisciplineId(item.id)}
                className={cn(
                  "group relative flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all duration-150 cursor-pointer border border-b-0 whitespace-nowrap",
                  isActive
                    ? "bg-white text-[#008b74] border-slate-300/80 shadow-xs z-10 -mb-[1px]"
                    : "bg-slate-200/40 text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-3 right-3 h-[2.5px] bg-[#008b74] rounded-full" />
                )}
                <Icon
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 transition-colors",
                    isActive ? "text-[#008b74]" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span>{item.name}</span>
                {isActive ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#008b74] shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Connected Action Toolbar Panel */}
        <div className="bg-white border border-slate-300/80 border-t-0 p-3.5 px-4 rounded-b-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              Hạng gói:
            </span>
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 gap-1 overflow-x-auto">
              {tierOptions.map((v) => {
                const isTierActive = tier === v.value;
                return (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setTier(v.value)}
                    className={cn(
                      "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                      isTierActive
                        ? "bg-white text-[#008b74] shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    )}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            {disciplineId
              ? `Đang lọc: ${tabDisciplines.find((d) => d.id === disciplineId)?.name ?? disciplineId}`
              : "Đang hiển thị toàn bộ 4 bộ môn"}
          </div>
        </div>
      </div>

      <StateMessage
        loading={plans.isPending}
        error={plans.error}
        onRetry={() => void plans.refetch()}
        empty={plans.data?.length === 0}
      />

      {actionError && (
        <p role="alert" className="notice error">
          {actionError}
        </p>
      )}

      <div className="card-grid">
        {plans.data?.map((plan) => (
          <article className="card plan-card" key={plan.id}>
            <span className="pill">
              {plan.discipline?.name ?? "Bộ môn"} · {plan.packageTier}
            </span>
            <h2>{plan.name}</h2>
            <p className="price">
              {money(plan.price)}
              {plan.packageTier === "VIP" && <small> + phí PT theo HLV</small>}
            </p>
            <p className="muted">
              {plan.durationDays} ngày · {plan.groupSessionQuota ?? 0} buổi nhóm ·{" "}
              {plan.ptSessionQuota ?? 0} buổi PT
            </p>
            {plan.description && <p>{plan.description}</p>}
            <Button
              type="button"
              variant="mint"
              disabled={order.isPending}
              onClick={() => choose(plan)}
            >
              {plan.packageTier === "VIP" ? "Chọn HLV & báo giá" : "Tiếp tục mua gói"}
            </Button>
          </article>
        ))}
      </div>
    </>
  );
};
