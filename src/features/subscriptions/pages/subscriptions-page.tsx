import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { get } from "@/lib/api";
import { memberKeys } from "@/lib/keys";
import type { Discipline, Subscription } from "@/lib/types";
import { SubscriptionCard } from "../components/subscription-card";

export const SubscriptionsPage: React.FC = () => {
  const { user } = useSession();
  const subscriptions = useQuery({
    queryKey: memberKeys.subscriptions(user!.id),
    queryFn: () => get<Subscription[]>("/memberships/subscriptions"),
  });
  const disciplines = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => get<Discipline[]>("/disciplines", true),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-06 · QUYỀN LỢI" title="Gói tập của tôi" />
      <p className="muted intro text-xs text-slate-500 mb-6">
        Mỗi gói có quota riêng theo subscriptionId. Không cộng lượt giữa các môn.
      </p>
      <StateMessage
        loading={subscriptions.isPending}
        error={subscriptions.error}
        onRetry={() => void subscriptions.refetch()}
        empty={subscriptions.data?.length === 0}
      />
      <div className="card-grid">
        {subscriptions.data?.map((item) => (
          <SubscriptionCard
            key={item.id}
            item={item}
            discipline={disciplines.data?.find((d) => d.id === item.disciplineId)}
          />
        ))}
      </div>
    </>
  );
};

export default SubscriptionsPage;
