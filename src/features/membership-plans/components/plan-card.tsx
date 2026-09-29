import React from "react";
import {
  Check,
  Clock,
  Users,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Flame,
  Dumbbell,
} from "lucide-react";
import { MembershipPlan, PackageTier } from "../types/plans.types";

interface PlanCardProps {
  plan: MembershipPlan;
  onSelect: (plan: MembershipPlan) => void;
}

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

const getTierBadge = (tier: PackageTier) => {
  switch (tier) {
    case "VIP":
      return {
        label: "Hạng VIP",
        badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
        cardBorder: "border-amber-400 ring-1 ring-amber-300/50 shadow-md",
        headerBg: "bg-gradient-to-r from-amber-500/10 via-amber-100/30 to-amber-500/5",
        accentColor: "text-amber-700",
      };
    case "PLUS":
      return {
        label: "Hạng Tiêu chuẩn",
        badgeClass: "bg-emerald-100 text-[#008b74] border-emerald-300",
        cardBorder: "border-emerald-300 ring-1 ring-emerald-200/50 shadow-sm",
        headerBg: "bg-emerald-50/50",
        accentColor: "text-[#008b74]",
      };
    case "TRIAL":
      return {
        label: "Trải nghiệm thử",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
        cardBorder: "border-slate-200 shadow-sm",
        headerBg: "bg-slate-50",
        accentColor: "text-slate-700",
      };
    case "BASIC":
    default:
      return {
        label: "Hạng Cơ bản",
        badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
        cardBorder: "border-sky-200 shadow-sm",
        headerBg: "bg-sky-50",
        accentColor: "text-sky-700",
      };
  }
};

const getTrainingModeLabel = (mode: string) => {
  switch (mode) {
    case "GROUP_CLASS":
      return "Lớp nhóm";
    case "PERSONAL_TRAINING":
      return "Kèm riêng 1:1";
    case "HYBRID":
      return "Lớp nhóm & PT 1:1";
    case "CUSTOM":
      return "Tập tự do";
    default:
      return mode;
  }
};

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onSelect }) => {
  const tierStyle = getTierBadge(plan.packageTier);
  const isVip = plan.packageTier === "VIP";

  return (
    <div
      className={`flex flex-col h-full bg-white rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${tierStyle.cardBorder}`}
    >
      {/* Top Banner / Tier tag */}
      <div className={`p-6 rounded-t-2xl border-b border-slate-100 ${tierStyle.headerBg}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${tierStyle.badgeClass}`}
          >
            {isVip && <Sparkles className="w-3.5 h-3.5" />}
            {tierStyle.label}
          </span>

          {plan.discipline && (
            <span className="text-xs font-medium text-slate-600 bg-white/90 border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              {plan.discipline.name}
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-2">
          {plan.name}
        </h3>

        <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">
          {plan.description || "Gói tập luyện rèn luyện thể chất tiêu chuẩn tại trung tâm thể thao."}
        </p>

        {/* Pricing */}
        <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            {formatCurrency(plan.price)}
          </span>
          <span className="text-xs font-medium text-slate-500">
            / {plan.durationDays >= 365 ? "dài hạn" : `${plan.durationDays} ngày`}
          </span>
        </div>
      </div>

      {/* Main Quota & Benefit Highlights */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Key Specs Pills */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
              <Clock className="w-4 h-4 text-[#008b74] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Thời hạn</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {plan.durationDays >= 365 ? "Không giới hạn" : `${plan.durationDays} ngày`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
              <Users className="w-4 h-4 text-[#008b74] shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Hình thức</span>
                <span className="font-semibold text-slate-800 truncate block" title={getTrainingModeLabel(plan.trainingMode)}>
                  {getTrainingModeLabel(plan.trainingMode)}
                </span>
              </div>
            </div>
          </div>

          {/* Benefits checklist */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
              Quyền lợi gói tập
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-600">
              {/* Gym Entry */}
              <li className="flex items-start gap-2">
                <div
                  className={`mt-0.5 rounded-full p-0.5 ${
                    plan.unlimitedGymEntry
                      ? "bg-emerald-100 text-[#008b74]"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>
                  {plan.unlimitedGymEntry ? (
                    <strong className="text-slate-800 font-semibold">
                      Ra vào phòng Gym không giới hạn lượt
                    </strong>
                  ) : (
                    "Ra vào phòng tập theo ca buổi tập đăng ký"
                  )}
                </span>
              </li>

              {/* Group Sessions */}
              <li className="flex items-start gap-2">
                <div
                  className={`mt-0.5 rounded-full p-0.5 ${
                    plan.groupSessionQuota > 0
                      ? "bg-emerald-100 text-[#008b74]"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                </div>
                <span>
                  {plan.groupSessionQuota > 0 ? (
                    <>
                      Bao gồm{" "}
                      <strong className="text-slate-800 font-semibold">
                        {plan.groupSessionQuota} buổi lớp nhóm
                      </strong>{" "}
                      chuyên biệt
                    </>
                  ) : (
                    <span className="text-slate-400">Không bao gồm lớp học nhóm</span>
                  )}
                </span>
              </li>

              {/* PT Coach Sessions */}
              <li className="flex items-start gap-2">
                <div
                  className={`mt-0.5 rounded-full p-0.5 ${
                    plan.ptSessionQuota > 0
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span>
                  {plan.ptSessionQuota > 0 ? (
                    <>
                      Bao gồm{" "}
                      <strong className="text-slate-800 font-semibold">
                        {plan.ptSessionQuota} buổi kèm 1:1 với Huấn luyện viên
                      </strong>
                    </>
                  ) : (
                    <span className="text-slate-400">Tự tập luyện, không kèm 1:1 riêng</span>
                  )}
                </span>
              </li>

              {/* Coach Policy statement */}
              <li className="flex items-start gap-2">
                <div className="mt-0.5 rounded-full p-0.5 bg-sky-100 text-sky-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <span>
                  {plan.ptSessionQuota > 0 ? (
                    <>Chính sách Coach: Hỗ trợ lộ trình cá nhân hóa, sắp xếp giờ linh hoạt.</>
                  ) : plan.groupSessionQuota > 0 ? (
                    <>Chính sách Coach: HLV phụ trách hướng dẫn kỹ thuật theo khung giờ lớp.</>
                  ) : (
                    <>Chính sách Coach: HLV sàn hướng dẫn an toàn máy tập cơ bản.</>
                  )}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-6 mt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => onSelect(plan)}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              isVip
                ? "bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/30"
                : "bg-[#008b74] hover:bg-[#007562] text-white shadow-sm shadow-[#008b74]/30"
            }`}
          >
            <span>Xem chi tiết quyền lợi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
