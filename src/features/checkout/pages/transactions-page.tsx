import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { get, money, query } from "@/lib/api";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Checkout } from "@/lib/types";

export const TransactionsPage: React.FC = () => {
  const { user } = useSession();
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState("");

  const transactions = useQuery({
    queryKey: [...memberKeys.transactions(user!.id), status, cursor],
    queryFn: () =>
      get<{ items: Checkout[]; nextCursor: string | null }>(
        `/billing/checkouts${query({ status, cursor, limit: 20 })}`
      ),
  });

  return (
    <>
      <PageTitle eyebrow="MEM-05 · GIAO DỊCH" title="Lịch sử checkout" />
      <div className="toolbar">
        <label>
          Trạng thái
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setCursor("");
            }}
          >
            <option value="">Tất cả</option>
            {[
              "PENDING_PAYMENT",
              "PAYMENT_FAILED",
              "FULFILLED",
              "EXPIRED",
              "PAYMENT_REVIEW",
              "REFUND_PENDING",
              "REFUNDED",
            ].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>

      <StateMessage
        loading={transactions.isPending}
        error={transactions.error}
        onRetry={() => void transactions.refetch()}
        empty={transactions.data?.items.length === 0}
      />

      <div className="list">
        {transactions.data?.items.map((item) => (
          <Link
            key={item.checkoutId}
            className="list-row"
            to={`/portal/member/checkouts/${item.checkoutId}`}
          >
            <span>
              <strong>{String(item.priceSnapshot.planName ?? item.kind)}</strong>
              <small>
                {vietnamDate(item.createdAt)} · {item.checkoutId}
              </small>
            </span>
            <span>
              {money(item.amount)}
              <small>{item.status}</small>
            </span>
          </Link>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        {cursor && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCursor("")}
          >
            Trang đầu
          </Button>
        )}
        {transactions.data?.nextCursor && (
          <Button
            variant="secondary"
            type="button"
            onClick={() => setCursor(transactions.data!.nextCursor!)}
          >
            Trang tiếp
          </Button>
        )}
      </div>
    </>
  );
};

export default TransactionsPage;
