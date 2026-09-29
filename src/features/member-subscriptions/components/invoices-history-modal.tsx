import React, { useEffect, useState } from "react";
import { X, Receipt, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { Invoice } from "../types/subscriptions.types";
import { getMyInvoicesApi } from "../services/subscriptions-api.service";

interface InvoicesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "0 đ (Miễn phí)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export const InvoicesHistoryModal: React.FC<InvoicesHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyInvoicesApi();
      setInvoices(data);
    } catch (err: unknown) {
      console.error("Failed to load invoices:", err);
      setError("Không thể tải lịch sử hóa đơn thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Lịch sử Hóa đơn & Giao dịch
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các chứng từ giao dịch thanh toán gói tập được lưu trữ trên hệ thống.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-600">
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadInvoices}
                className="font-semibold underline hover:text-rose-900"
              >
                Thử lại
              </button>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#008b74]" />
              <span>Đang tải dữ liệu hóa đơn...</span>
            </div>
          ) : invoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p>Chưa có giao dịch thanh toán nào được ghi nhận.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {inv.invoiceCode}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-[#008b74]">
                        {inv.status || "PAID"}
                      </span>
                    </div>

                    <div className="text-slate-500 text-[11px] flex items-center gap-2">
                      <span>Loại: {inv.type}</span>
                      <span>•</span>
                      <span>Phương thức: {inv.paymentMethod}</span>
                      <span>•</span>
                      <span>{formatDate(inv.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-bold text-slate-900 block">
                      {formatCurrency(inv.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
