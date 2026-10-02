import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { Button } from "@/components/ui/button";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Discipline, Subscription } from "@/lib/types";

export interface SubscriptionCardProps {
  item: Subscription;
  discipline?: Discipline;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ item, discipline }) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const cache = useQueryClient();
  const [sessions, setSessions] = useState(1);
  const [actionError, setActionError] = useState("");

  const preview = useQuery({
    queryKey: ["member", user!.id, "addon-preview", item.id, sessions],
    queryFn: () =>
      get<{ ratePerSession: string; amount: string }>(
        `/billing/subscriptions/${item.id}/pt-addon-preview${query({ sessions })}`
      ),
    enabled: item.status === "ACTIVE" && item.packageTier === "VIP" && Boolean(item.assignedCoach),
    retry: false,
  });

  const checkout = useMutation({
    mutationFn: (kind: "RENEWAL" | "PT_ADDON") =>
      createCheckout(
        user!.id,
        kind === "RENEWAL"
          ? { kind, subscriptionId: item.id }
          : { kind, subscriptionId: item.id, addonSessions: sessions }
      ),
    onSuccess: (order) => {
      void cache.invalidateQueries({ queryKey: memberKeys.transactions(user!.id) });
      navigate(`/portal/member/checkouts/${order.checkoutId}`);
    },
    onError: (error) => setActionError(errorText(error)),
  });

  return (
    <article className="card">
      <span className="pill">
        {discipline?.name ?? item.plan?.discipline?.name ?? "Bộ môn"} · {item.packageTier}
      </span>
      <h2>{item.plan?.name}</h2>
      <p>
        <span className={`status status-${item.status.toLowerCase()}`}>{item.status}</span> ·{" "}
        {vietnamDate(item.startDate)} – {vietnamDate(item.endDate)}
      </p>
      <p>
        Nhóm: <strong>{item.remainingGroupSessions ?? 0}</strong> · PT:{" "}
        <strong>{item.remainingPtSessions ?? 0}</strong>
      </p>
      {item.assignedCoach && <p>HLV: {item.assignedCoach.fullName}</p>}
      <p className="mono muted text-[11px]">subscriptionId: {item.id}</p>
      <div className="button-row mt-3">
        {!["TRIAL", "DROP_IN"].includes(item.packageTier) && (
          <Button
            type="button"
            variant="secondary"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate("RENEWAL")}
          >
            Gia hạn
          </Button>
        )}
      </div>
      {item.packageTier === "VIP" && item.status === "ACTIVE" && (
        <div className="addon mt-4 pt-3 border-t border-slate-100">
          <label className="text-xs font-bold block mb-1">
            Mua thêm PT
            <input
              type="number"
              min="1"
              max="100"
              value={sessions}
              onChange={(event) =>
                setSessions(Math.max(1, Math.min(100, Number(event.target.value) || 1)))
              }
              className="mt-1 block w-24 rounded-lg border border-slate-200 px-2.5 py-1 text-xs"
            />
          </label>
          {preview.data && (
            <p className="text-xs text-slate-600 mt-1">
              Dự kiến: {money(preview.data.amount)} ({money(preview.data.ratePerSession)}/buổi)
            </p>
          )}
          {preview.error && <p className="text-error text-xs">{errorText(preview.error)}</p>}
          <Button
            type="button"
            variant="mint"
            size="sm"
            className="mt-2"
            disabled={checkout.isPending || !preview.data}
            onClick={() => checkout.mutate("PT_ADDON")}
          >
            Tạo checkout add-on
          </Button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="text-error text-xs mt-2">
          {actionError}
        </p>
      )}
    </article>
  );
};
