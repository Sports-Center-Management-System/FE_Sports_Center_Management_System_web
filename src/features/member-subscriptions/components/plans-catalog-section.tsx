import React from "react";
import {
  Sparkles,
  Clock,
  Users,
  UserCheck,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { MembershipPlan, PackageTier } from "../types/subscriptions.types";

interface PlansCatalogSectionProps {
  plans: MembershipPlan[];
  onSelectPlan: (plan: MembershipPlan) => void;
}

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

const getTierBadge = (tier: PackageTier) => {
  switch (tier) {
    case "VIP":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "PLUS":
      return "bg-emerald-100 text-[#008b74] border-emerald-300";
    case "TRIAL":
      return "bg-slate-100 text-slate-700 border-slate-300";
    case "BASIC":
    default:
      return "bg-sky-100 text-sky-800 border-sky-300";
  }
};

export const PlansCatalogSection: React.FC<PlansCatalogSectionProps> = ({
  plans,
  onSelectPlan,
}) => {
  if (plans.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#008b74] border border-emerald-200 mb-1.5">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Mở rộng luyện tập</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Đăng ký gói tập mới & Bộ môn bổ sung
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Lựa chọn gói tập phù hợp theo mục tiêu rèn luyện thể chất, lớp nhóm hoặc kèm 1:1 cùng Huấn luyện viên.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isVip = p.packageTier === "VIP";
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between p-6 ${
                isVip
                  ? "border-amber-300 ring-1 ring-amber-200/50"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTierBadge(
                      p.packageTier
                    )}`}
                  >
                    {isVip && <Sparkles className="w-3 h-3 text-amber-600" />}
                    Hạng {p.packageTier}
                  </span>

                  {p.discipline && (
                    <span className="text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-lg">
                      {p.discipline.name}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {p.name}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[32px]">
                  {p.description || "Gói tập luyện thể thao chuyên nghiệp tại trung tâm."}
                </p>

                {/* Price */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(p.price)}
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    / {p.durationDays >= 365 ? "dài hạn" : `${p.durationDays} ngày`}
                  </span>
                </div>

                {/* Benefits */}
                <ul className="mt-4 space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#008b74] shrink-0" />
                    <span>
                      {p.groupSessionQuota > 0
                        ? `${p.groupSessionQuota} buổi lớp nhóm`
                        : "Không có lớp nhóm"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {p.ptSessionQuota > 0
                        ? `${p.ptSessionQuota} buổi kèm riêng 1:1 Coach`
                        : "Tự tập luyện"}
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>
                      {p.unlimitedGymEntry
                        ? "Vào cửa Gym không giới hạn"
                        : "Theo ca buổi tập đã đăng ký"}
                    </span>
                  </li>
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-6 mt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onSelectPlan(p)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    isVip
                      ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/30"
                      : "bg-[#008b74] hover:bg-[#007562] text-white shadow-sm shadow-[#008b74]/30"
                  }`}
                >
                  <span>Đăng ký mua gói này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
