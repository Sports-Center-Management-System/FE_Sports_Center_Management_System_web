import React from "react";
import { Check, Minus, Eye, Sparkles } from "lucide-react";
import { MembershipPlan } from "../types/plans.types";

interface PlanComparisonTableProps {
  plans: MembershipPlan[];
  onSelect: (plan: MembershipPlan) => void;
}

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

export const PlanComparisonTable: React.FC<PlanComparisonTableProps> = ({
  plans,
  onSelect,
}) => {
  if (plans.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mt-12">
      <div className="p-6 border-b border-slate-100 bg-slate-50/70">
        <h3 className="text-base font-bold text-slate-900">
          Bảng đối chiếu quyền lợi các gói tập
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          So sánh trực quan về chi phí, số buổi đào tạo, chính sách Huấn luyện viên và quyền ra vào cơ sở.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-600 border-collapse">
          <thead>
            <tr className="bg-slate-100/70 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <th className="py-3.5 px-4 min-w-[200px]">Tên gói tập</th>
              <th className="py-3.5 px-4 min-w-[130px]">Bộ môn</th>
              <th className="py-3.5 px-4 min-w-[100px]">Phân hạng</th>
              <th className="py-3.5 px-4 min-w-[120px]">Giá cước</th>
              <th className="py-3.5 px-4 min-w-[110px]">Thời hạn</th>
              <th className="py-3.5 px-4 min-w-[120px]">Buổi lớp nhóm</th>
              <th className="py-3.5 px-4 min-w-[130px]">Buổi 1:1 Coach (PT)</th>
              <th className="py-3.5 px-4 min-w-[140px]">Vào cửa Gym tự do</th>
              <th className="py-3.5 px-4 text-right min-w-[110px]">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plans.map((p) => {
              const isVip = p.packageTier === "VIP";
              return (
                <tr
                  key={p.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isVip ? "bg-amber-50/20" : ""
                  }`}
                >
                  {/* Name */}
                  <td className="py-4 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      {isVip && <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      <span>{p.name}</span>
                    </div>
                  </td>

                  {/* Discipline */}
                  <td className="py-4 px-4 text-slate-700">
                    {p.discipline?.name || "Thể thao chung"}
                  </td>

                  {/* Tier */}
                  <td className="py-4 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                        isVip
                          ? "bg-amber-100 text-amber-800"
                          : p.packageTier === "PLUS"
                          ? "bg-emerald-100 text-[#008b74]"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.packageTier}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4 font-bold text-slate-900">
                    {formatCurrency(p.price)}
                  </td>

                  {/* Duration */}
                  <td className="py-4 px-4 text-slate-700">
                    {p.durationDays >= 365 ? "Dài hạn" : `${p.durationDays} ngày`}
                  </td>

                  {/* Group session quota */}
                  <td className="py-4 px-4">
                    {p.groupSessionQuota > 0 ? (
                      <span className="font-semibold text-slate-800">
                        {p.groupSessionQuota} buổi
                      </span>
                    ) : (
                      <span className="text-slate-400">Không</span>
                    )}
                  </td>

                  {/* PT session quota */}
                  <td className="py-4 px-4">
                    {p.ptSessionQuota > 0 ? (
                      <span className="font-bold text-amber-700">
                        {p.ptSessionQuota} buổi PT
                      </span>
                    ) : (
                      <span className="text-slate-400">Không</span>
                    )}
                  </td>

                  {/* Gym entry */}
                  <td className="py-4 px-4">
                    {p.unlimitedGymEntry ? (
                      <span className="inline-flex items-center gap-1 text-[#008b74] font-semibold">
                        <Check className="w-4 h-4" />
                        Không giới hạn
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Minus className="w-4 h-4" />
                        Theo ca lớp
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="py-4 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelect(p)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#008b74] hover:bg-emerald-50 border border-emerald-200 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
