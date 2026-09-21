import React from "react";
import { Badge } from "@/components/ui/badge";

export interface InvoiceItem {
  id: string;
  code: string;
  transactionDate: string;
  servicePackage: string;
  amount: string;
  status: "COMPLETED" | "PENDING" | "CANCELLED";
  statusLabel: string;
}

export interface InvoiceHistoryCardProps {
  title?: string;
  invoices?: InvoiceItem[];
}

export const InvoiceHistoryCard: React.FC<InvoiceHistoryCardProps> = ({
  title = "Lịch sử thanh toán & hóa đơn",
  invoices = [
    {
      id: "1",
      code: "#INV-94021",
      transactionDate: "12/12/2025",
      servicePackage: "Elite Wellness Platinum",
      amount: "11.000.000đ",
      status: "COMPLETED",
      statusLabel: "Hoàn thành",
    },
    {
      id: "2",
      code: "#INV-38491",
      transactionDate: "15/08/2025",
      servicePackage: "Mint Basic 12 Buổi PT",
      amount: "6.000.000đ",
      status: "COMPLETED",
      statusLabel: "Hoàn thành",
    },
  ],
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all hover:shadow-md">
      <h3 className="text-lg font-bold tracking-tight text-slate-900">
        {title}
      </h3>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100/80 pb-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              <th className="pb-3 font-semibold">MÃ HÓA ĐƠN</th>
              <th className="pb-3 font-semibold">NGÀY GIAO DỊCH</th>
              <th className="pb-3 font-semibold">GÓI DỊCH VỤ</th>
              <th className="pb-3 font-semibold">SỐ TIỀN</th>
              <th className="pb-3 font-semibold text-center">TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {invoices.map((inv) => (
              <tr
                key={inv.id}
                className="group transition-colors hover:bg-slate-50/70"
              >
                <td className="py-4.5 font-bold text-slate-900">
                  {inv.code}
                </td>
                <td className="py-4.5 text-slate-600">
                  {inv.transactionDate}
                </td>
                <td className="py-4.5 font-medium text-slate-700">
                  {inv.servicePackage}
                </td>
                <td className="py-4.5 font-bold text-slate-900">
                  {inv.amount}
                </td>
                <td className="py-4.5 text-center">
                  <span className="inline-flex items-center rounded-full bg-[#e6f7f2] px-3 py-1 text-[11px] font-semibold text-[#008b74]">
                    {inv.statusLabel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
