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
      <div className="toolbar">
        <label>
          Môn tập
          <select value={disciplineId} onChange={(event) => setDisciplineId(event.target.value)}>
            <option value="">Tất cả môn</option>
            {disciplines.data?.map((discipline) => (
              <option key={discipline.id} value={discipline.id}>
                {discipline.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Loại gói
          <select value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="">Tất cả gói</option>
            {["TRIAL", "DROP_IN", "PLUS", "VIP"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
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
