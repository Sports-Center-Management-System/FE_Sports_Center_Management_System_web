import React from "react";
import { MembershipPlan } from "../types";
import { Button } from "@/components/ui/button";
import { Edit2, Ban, RotateCcw, Clock, Users, User, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanListTableProps {
  plans: MembershipPlan[];
  onEditPlan: (plan: MembershipPlan) => void;
  onDeactivatePlan: (plan: MembershipPlan) => void;
  onReactivatePlan: (plan: MembershipPlan) => void;
}

export const PlanListTable: React.FC<PlanListTableProps> = ({
  plans,
  onEditPlan,
  onDeactivatePlan,
  onReactivatePlan,
}) => {
  const formatVND = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "VIP":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "PLUS":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "DROP_IN":
        return "bg-sky-50 text-sky-700 border-sky-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getDisciplineBadge = (discipline: string) => {
    switch (discipline) {
      case "GYM":
        return "bg-slate-900 text-white";
      case "BOXING":
        return "bg-rose-600 text-white";
      case "YOGA":
        return "bg-[#008b74] text-white";
      case "DANCING":
        return "bg-violet-600 text-white";
      default:
        return "bg-slate-700 text-white";
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[950px]">
          <thead className="bg-[#f8fafc] text-slate-500 font-semibold border-b border-slate-200 uppercase text-[10px] tracking-wider select-none">
            <tr>
              <th className="py-3.5 px-4">Gói Cước & Mã</th>
              <th className="py-3.5 px-4">Bộ Môn</th>
              <th className="py-3.5 px-4">Hạng Vé</th>
              <th className="py-3.5 px-4">Giá Bán</th>
              <th className="py-3.5 px-4 text-center">Thời Hạn</th>
              <th className="py-3.5 px-4">Định Mức Lớp & PT</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {plans.map((plan) => (
              <tr
                key={plan.id}
                className={cn(
                  "hover:bg-slate-50/70 transition-colors",
                  !plan.isActive ? "bg-slate-50/40 text-slate-400" : ""
                )}
              >
                {/* 1. Tên gói & Mã định danh */}
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 whitespace-nowrap shrink-0">
                      {plan.code}
                    </span>
                    <span
                      className={cn(
                        "font-bold text-xs",
                        plan.isActive ? "text-slate-900" : "text-slate-500 line-through"
                      )}
                    >
                      {plan.name}
                    </span>
                  </div>
                  {plan.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xs">
                      {plan.description}
                    </p>
                  )}
                </td>

                {/* 2. Bộ môn */}
                <td className="py-3.5 px-4 align-top">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[10px] font-bold tracking-wide uppercase whitespace-nowrap shrink-0",
                      getDisciplineBadge(plan.discipline)
                    )}
                  >
                    {plan.discipline}
                  </span>
                </td>

                {/* 3. Hạng vé */}
                <td className="py-3.5 px-4 align-top">
                  <span
                    className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] border whitespace-nowrap shrink-0",
                      getTierBadge(plan.tier)
                    )}
                  >
                    {plan.tierLabel}
                  </span>
                </td>

                {/* 4. Giá bán */}
                <td className="py-3.5 px-4 align-top">
                  <div className="font-mono font-bold text-xs text-slate-900">
                    {formatVND(plan.price)}
                  </div>
                </td>

                {/* 5. Thời hạn */}
                <td className="py-3.5 px-4 align-top text-center">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {plan.durationDays} ngày
                  </span>
                </td>

                {/* 6. Định mức quota */}
                <td className="py-3.5 px-4 align-top">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Users className="h-3 w-3 text-slate-400 shrink-0" />
                      <span>
                        Lớp nhóm:{" "}
                        <strong
                          className={cn(
                            plan.discipline === "GYM"
                              ? "text-slate-400 font-normal italic"
                              : "text-[#008b74]"
                          )}
                        >
                          {plan.discipline === "GYM" ? "Không áp dụng (Gym)" : `${plan.groupClassQuota} buổi`}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <User className="h-3 w-3 text-amber-500 shrink-0" />
                      <span>
                        Buổi PT:{" "}
                        <strong className="text-amber-700">
                          {plan.ptSessionQuota > 0 ? `${plan.ptSessionQuota} buổi 1:1` : "Không có"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </td>

                {/* 7. Trạng thái */}
                <td className="py-3.5 px-4 align-top text-center">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0",
                      plan.isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}
                  >
                    {plan.isActive ? "Đang mở bán" : "Ngừng bán"}
                  </span>
                </td>

                {/* 8. Thao tác */}
                <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    {plan.isActive ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPlan(plan)}
                          className="h-7 px-2 text-[11px] font-semibold text-slate-700 hover:text-[#008b74] hover:bg-[#e6f7f2] border-slate-200 rounded-lg flex items-center gap-1"
                          title="Sửa giá hoặc định mức (PUT)"
                        >
                          <Edit2 className="h-3 w-3 text-slate-400" /> Sửa
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onDeactivatePlan(plan)}
                          className="h-7 px-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border-slate-200 rounded-lg flex items-center gap-1"
                          title="Ngừng kinh doanh gói (DELETE - Soft-delete)"
                        >
                          <Ban className="h-3 w-3 text-rose-400" /> Ngừng bán
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onReactivatePlan(plan)}
                        className="h-7 px-2 text-[11px] font-semibold text-[#008b74] hover:bg-[#e6f7f2] border-slate-200 rounded-lg flex items-center gap-1"
                        title="Mở bán lại gói này"
                      >
                        <RotateCcw className="h-3 w-3" /> Mở bán lại
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
