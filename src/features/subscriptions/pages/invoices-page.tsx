import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  Clock,
  CreditCard,
  ReceiptText,
  RotateCcw,
  XCircle,
  ArrowUpDown,
  DollarSign,
} from "lucide-react";
import { useSession } from "@/auth/session-context";
import { StateMessage } from "@/components/feedback/state-message";
import { Badge } from "@/components/ui/badge";
import { get, money } from "@/lib/api";
import { vietnamDate } from "@/lib/date";
import { memberKeys } from "@/lib/keys";
import type { Invoice } from "@/lib/types";
import { cn } from "@/lib/utils";

const invoiceStatusStyles: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  PAID: {
    label: "Đã thanh toán",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
  },
  PENDING: {
    label: "Chờ thanh toán",
    className: "border-amber-200 bg-amber-50 text-amber-800",
    icon: Clock,
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    className: "border-sky-200 bg-sky-50 text-sky-800",
    icon: RotateCcw,
  },
  CANCELLED: {
    label: "Đã hủy",
    className: "border-rose-200 bg-rose-50 text-rose-800",
    icon: XCircle,
  },
};

const invoiceTypeLabels: Record<string, string> = {
  SUBSCRIPTION_NEW: "Đăng ký gói tập mới",
  DROP_IN: "Gói tập theo buổi lẻ",
  PT_ADDON: "Mua thêm buổi kèm HLV 1:1",
};

const paymentMethodLabels: Record<string, string> = {
  CASH: "Tiền mặt",
  BANK_TRANSFER: "Chuyển khoản QR",
  CARD: "Thẻ ngân hàng",
  MOCK: "Thanh toán thử nghiệm",
  FREE: "Miễn phí",
};

export const InvoicesPage: React.FC = () => {
  const { user } = useSession();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");

  const invoices = useQuery({
    queryKey: memberKeys.invoices(user!.id),
    queryFn: () => get<Invoice[]>("/billing/invoices"),
  });

  // Calculate summary metrics
  const stats = useMemo(() => {
    const list = invoices.data || [];
    let totalPaid = 0;
    let paidCount = 0;
    let pendingCount = 0;

    for (const inv of list) {
      if (inv.status === "PAID") {
        totalPaid += Number(inv.amount || 0);
        paidCount++;
      } else if (inv.status === "PENDING") {
        pendingCount++;
      }
    }

    return {
      totalPaid,
      paidCount,
      pendingCount,
      totalCount: list.length,
    };
  }, [invoices.data]);

  // Filter & sort invoices
  const filteredInvoices = useMemo(() => {
    let list = invoices.data || [];

    // Filter by status
    if (statusFilter !== "ALL") {
      list = list.filter((inv) => inv.status === statusFilter);
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "date-asc") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "amount-desc") {
        return Number(b.amount || 0) - Number(a.amount || 0);
      }
      if (sortBy === "amount-asc") {
        return Number(a.amount || 0) - Number(b.amount || 0);
      }
      return 0;
    });
  }, [invoices.data, statusFilter, sortBy]);

  return (
    <div className="w-full max-w-5xl mx-auto py-4 sm:py-6 pb-20">
      {/* Div trắng bao quanh tất cả component ở trang hóa đơn */}
      <div className="bg-white rounded-md border border-slate-200 p-5 sm:p-7 space-y-6 shadow-xs">
        {/* Header (đã bỏ nút quay lại) */}
        <div className="pb-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lịch sử hóa đơn &amp; Thanh toán
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Theo dõi và quản lý toàn bộ các giao dịch gói tập tại 3TC Fitness Center
            </p>
          </div>
          <div className="h-10 w-10 rounded-md bg-emerald-50 text-[#008b74] flex items-center justify-center shrink-0 border border-emerald-100">
            <ReceiptText className="w-5 h-5" />
          </div>
        </div>

        {/* 3 Summary Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50/70 rounded-md border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tổng tiền đã thanh toán
              </span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                {money(stats.totalPaid)}
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-white text-[#008b74] flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-md border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Hóa đơn thành công
              </span>
              <p className="text-xl font-black text-emerald-700 font-mono mt-1">
                {stats.paidCount} <span className="text-xs font-normal text-slate-500">hóa đơn</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-white text-emerald-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50/70 rounded-md border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Chờ thanh toán / Khác
              </span>
              <p className="text-xl font-black text-amber-700 font-mono mt-1">
                {stats.pendingCount} <span className="text-xs font-normal text-slate-500">hóa đơn</span>
              </p>
            </div>
            <div className="h-10 w-10 rounded-md bg-white text-amber-600 flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Structured Table Section with Filter & Sorting Controls */}
        <div className="rounded-md border border-slate-200 overflow-hidden">
          {/* Controls: Filter & Sorting */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "PAID", label: "Đã thanh toán" },
                { id: "PENDING", label: "Chờ thanh toán" },
                { id: "REFUNDED", label: "Đã hoàn tiền" },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-bold transition-all shrink-0 cursor-pointer border",
                      active
                        ? "bg-[#008b74] text-white border-[#008b74] shadow-xs"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sắp xếp:</span>
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-9 px-3 rounded-md text-xs font-bold bg-white border border-slate-300 text-slate-700 cursor-pointer focus:outline-none focus:border-[#008b74] shadow-xs"
              >
                <option value="date-desc">Thời gian: Mới nhất</option>
                <option value="date-asc">Thời gian: Cũ nhất</option>
                <option value="amount-desc">Số tiền: Cao đến thấp</option>
                <option value="amount-asc">Số tiền: Thấp đến cao</option>
              </select>
            </div>
          </div>

          {/* State Messages */}
          <StateMessage
            loading={invoices.isPending}
            error={invoices.error}
            onRetry={() => void invoices.refetch()}
            empty={filteredInvoices.length === 0}
            emptyText="Không tìm thấy hóa đơn nào phù hợp với bộ lọc hiện tại."
          />

          {/* Structured Invoices Table */}
          {!invoices.isPending && filteredInvoices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3.5 px-4 text-center w-12">STT</th>
                    <th className="py-3.5 px-4">Dịch vụ &amp; Hạng mục</th>
                    <th className="py-3.5 px-4">Phương thức</th>
                    <th className="py-3.5 px-4">Thời gian tạo</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Số tiền</th>
                    <th className="py-3.5 px-4 text-center w-28">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInvoices.map((item, index) => {
                    const status = invoiceStatusStyles[item.status] ?? {
                      label: item.status,
                      className: "border-slate-200 bg-slate-50 text-slate-700",
                      icon: CircleHelp,
                    };
                    const StatusIcon = status.icon;
                    const checkoutPath = item.checkoutId
                      ? `/portal/member/checkouts/${encodeURIComponent(item.checkoutId)}`
                      : null;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        {/* 1. STT */}
                        <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        {/* 2. Dịch vụ */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                              <ReceiptText className="w-4 h-4 text-[#008b74]" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 leading-snug">
                                {invoiceTypeLabels[item.type] ?? item.type}
                              </p>
                              <span className="text-[11px] text-slate-500 font-medium">
                                Hóa đơn dịch vụ thể thao 3TC
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Phương thức */}
                        <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>{paymentMethodLabels[item.paymentMethod] ?? item.paymentMethod}</span>
                          </span>
                        </td>

                        {/* 4. Thời gian */}
                        <td className="py-4 px-4 text-slate-600 font-medium whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <time dateTime={item.createdAt}>{vietnamDate(item.createdAt)}</time>
                          </span>
                        </td>

                        {/* 5. Trạng thái */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold border",
                              status.className
                            )}
                          >
                            <StatusIcon className="w-3 h-3 shrink-0" />
                            <span>{status.label}</span>
                          </Badge>
                        </td>

                        {/* 6. Số tiền */}
                        <td className="py-4 px-4 text-right font-black text-slate-900 font-mono whitespace-nowrap text-sm sm:text-base">
                          {money(item.amount)}
                        </td>

                        {/* 7. Thao tác */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {checkoutPath ? (
                            <Link
                              to={checkoutPath}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-white hover:bg-slate-100 text-[#008b74] border border-slate-300 hover:border-[#008b74] transition-all shadow-2xs"
                            >
                              <span>Xem đơn</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Link>
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoicesPage;
