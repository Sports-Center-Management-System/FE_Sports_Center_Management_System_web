import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import type { Coach, Plan, Quote } from "@/lib/types";

export const VipQuotationPage: React.FC = () => {
  const [params] = useSearchParams();
  const planId = params.get("planId") ?? "";
  const { user } = useSession();
  const navigate = useNavigate();
  const [coachId, setCoachId] = useState("");

  const plans = useQuery({
    queryKey: ["catalog", "all"],
    queryFn: () => get<Plan[]>("/memberships/plans", true),
  });

  const plan = plans.data?.find((item) => item.id === planId);
  const coaches = useQuery({ queryKey: ["coaches"], queryFn: () => get<Coach[]>("/coaches") });

  const compatible =
    coaches.data?.filter((coach) =>
      coach.coachProfile?.coachSpecialties?.some(
        (entry) => entry.specialty.disciplineId === plan?.disciplineId
      )
    ) ?? [];

  const quote = useQuery({
    queryKey: ["quote", planId, coachId],
    queryFn: () => get<Quote>(`/billing/quotations/vip${query({ planId, coachId })}`),
    enabled: Boolean(plan?.packageTier === "VIP" && coachId),
  });

  const checkout = useMutation({
    mutationFn: () => createCheckout(user!.id, { kind: "NEW_SUBSCRIPTION", planId, coachId }),
    onSuccess: (order) => {
      sessionStorage.setItem(
        `sportscenter.quote:${order.checkoutId}`,
        String(quote.data?.totalAmount ?? "")
      );
      navigate(`/portal/member/checkouts/${order.checkoutId}`);
    },
  });

  return (
    <>
      <PageTitle eyebrow="MEM-03 · BÁO GIÁ" title="Báo giá VIP theo huấn luyện viên" />
      <StateMessage
        loading={plans.isPending || coaches.isPending}
        error={plans.error ?? coaches.error}
      />
      {plans.data && !plan && (
        <div className="notice error">
          Không tìm thấy gói đang bán. <Link to="/portal/member/plans">Xem catalog</Link>
        </div>
      )}
      {plan && plan.packageTier !== "VIP" && (
        <div className="notice">
          Gói này dùng giá catalog. <Link to="/portal/member/plans">Quay lại</Link>
        </div>
      )}
      {plan?.packageTier === "VIP" && (
        <div className="two-column">
          <article className="card">
            <span className="pill">{plan.discipline?.name} · VIP</span>
            <h2>{plan.name}</h2>
            <p>
              Giá gốc: <strong>{money(plan.price)}</strong>
            </p>
            <p>
              {plan.groupSessionQuota ?? 0} buổi nhóm + {plan.ptSessionQuota ?? 0} buổi PT ·{" "}
              {plan.durationDays} ngày
            </p>
            <label>
              Chọn HLV
              <select value={coachId} onChange={(event) => setCoachId(event.target.value)}>
                <option value="">Chọn HLV phù hợp</option>
                {compatible.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.fullName}
                  </option>
                ))}
              </select>
            </label>
            {compatible.length === 0 && <p className="muted">Chưa có HLV phù hợp với môn này.</p>}
          </article>
          <article className="card">
            <h2>Bảng giá dự kiến</h2>
            {!coachId ? (
              <p className="muted">Chọn HLV để máy chủ tính giá.</p>
            ) : (
              <>
                <StateMessage
                  loading={quote.isPending}
                  error={quote.error}
                  onRetry={() => void quote.refetch()}
                />
                {quote.data && (
                  <>
                    <p>Giá gốc: {money(quote.data.baseAmount)}</p>
                    <p>
                      {quote.data.ptSessions} PT × {money(quote.data.ratePerSession)}:{" "}
                      {money(quote.data.ptAmount)}
                    </p>
                    <p className="price">{money(quote.data.totalAmount)}</p>
                    <p className="muted">
                      Giá chỉ để tham khảo; checkout sẽ tính lại và khóa snapshot.
                    </p>
                    <Button
                      type="button"
                      variant="mint"
                      disabled={checkout.isPending || !quote.data.eligible}
                      onClick={() => checkout.mutate()}
                    >
                      Tạo checkout
                    </Button>
                  </>
                )}
              </>
            )}
            {checkout.error && (
              <p role="alert" className="text-error">
                {errorText(checkout.error)}
              </p>
            )}
          </article>
        </div>
      )}
    </>
  );
};

export default VipQuotationPage;
