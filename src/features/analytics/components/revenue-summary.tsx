import React from "react";
import { Activity, Dumbbell, WalletCards } from "lucide-react";
import { RevenueReport } from "@/features/analytics/types/analytics.types";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

interface RevenueSummaryProps {
  revenue: RevenueReport | null;
  isLoading: boolean;
}

const cards = [
  {
    key: "totalRevenue",
    label: "Tổng doanh thu",
    icon: WalletCards,
    tone: "bg-[#e9fbf5] text-[#007c68]",
  },
  {
    key: "baseRevenue",
    label: "Doanh thu cơ bản",
    icon: Activity,
    tone: "bg-[#eef6ff] text-[#2563eb]",
  },
  {
    key: "ptRevenue",
    label: "Doanh thu PT",
    icon: Dumbbell,
    tone: "bg-[#fff7ed] text-[#c2410c]",
  },
] as const;

export const formatVnd = (value: number): string => currencyFormatter.format(value);

export const RevenueSummary: React.FC<RevenueSummaryProps> = ({ revenue, isLoading }) => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = revenue?.[card.key] ?? 0;

        return (
          <article
            key={card.key}
            className="rounded-lg border border-[#dceee8] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#6a7d78]">{card.label}</p>
                {isLoading ? (
                  <div className="mt-3 h-8 w-36 animate-pulse rounded bg-[#e8f3ef]" />
                ) : (
                  <p className="mt-2 text-2xl font-bold text-[#10221f]">{formatVnd(value)}</p>
                )}
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-md ${card.tone}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
