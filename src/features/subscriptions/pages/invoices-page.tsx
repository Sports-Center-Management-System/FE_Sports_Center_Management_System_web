import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { get, money } from "@/lib/api";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Invoice } from "@/lib/types";

export const InvoicesPage: React.FC = () => {
  const { user } = useSession();
  const invoices = useQuery({
    queryKey: memberKeys.invoices(user!.id),
    queryFn: () => get<Invoice[]>("/billing/invoices"),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-07 · HÓA ĐƠN" title="Hóa đơn của tôi" />
      <p className="muted intro text-xs text-slate-500 mb-6">
        Danh sách hiện giới hạn 200 hóa đơn gần nhất theo API.
      </p>
      <StateMessage
        loading={invoices.isPending}
        error={invoices.error}
        onRetry={() => void invoices.refetch()}
        empty={invoices.data?.length === 0}
      />
      <div className="list">
        {invoices.data?.map((item) => (
          <article className="list-row" key={item.id}>
            <span>
              <strong>{item.invoiceCode}</strong>
              <small>
                {vietnamDate(item.createdAt)} · subscriptionId: {item.subscriptionId}
              </small>
            </span>
            <span>
              <strong>{money(item.amount)}</strong>
              <small>
                {item.status} · {item.type} · {item.paymentMethod}
              </small>
            </span>
          </article>
        ))}
      </div>
    </>
  );
};

export default InvoicesPage;
