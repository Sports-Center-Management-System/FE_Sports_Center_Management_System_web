import React from "react";
import {
  Calendar,
  Clock,
  Dumbbell,
  Users,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  PlusCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { UserSubscription, SubscriptionStatus, PackageTier } from "../types/subscriptions.types";

interface SubscriptionCardProps {
  subscription: UserSubscription;
  onRenew: (subscription: UserSubscription) => void;
  onBuyAddon?: (subscription: UserSubscription) => void;
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (val: string | number): string => {
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num) || num === 0) return "Miễn phí (0 đ)";
  return new Intl.NumberFormat("vi-VN").format(num) + " đ";
};

const getStatusBadge = (status: SubscriptionStatus, endDateStr: string) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (status === "FROZEN") {
    return {
      label: "Đang đóng băng",
      badgeClass: "bg-sky-100 text-sky-800 border-sky-300",
      daysText: "Tạm ngưng sử dụng",
    };
  }

  if (status === "EXPIRED" || diffDays < 0) {
    return {
      label: "Đã hết hạn",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      daysText: "Hết hạn",
    };
  }

  if (diffDays <= 5) {
    return {
      label: "Sắp hết hạn",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      daysText: `Còn lại ${diffDays} ngày`,
    };
  }

  return {
    label: "Đang hoạt động",
    badgeClass: "bg-emerald-100 text-[#008b74] border-emerald-300",
    daysText: `Còn lại ${diffDays} ngày`,
  };
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

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onRenew,
  onBuyAddon,
}) => {
  const plan = subscription.plan;
  const statusInfo = getStatusBadge(subscription.status, subscription.endDate);
  const isVip = subscription.packageTier === "VIP";
  const canRenew =
    subscription.packageTier !== "TRIAL" &&
    subscription.status !== "FROZEN" &&
    plan?.isActive;

  // Calculate session consumption
  const totalGroup = plan?.groupSessionQuota || 0;
  const remainingGroup = subscription.remainingGroupSessions ?? 0;
  const usedGroup = Math.max(0, totalGroup - remainingGroup);

  const totalPt = plan?.ptSessionQuota || 0;
  const remainingPt = subscription.remainingPtSessions ?? 0;
  const usedPt = Math.max(0, totalPt - remainingPt);

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden ${
        isVip
          ? "border-amber-300 ring-1 ring-amber-200/50"
          : "border-slate-200"
      }`}
    >
      {/* Top Header */}
      <div
        className={`p-6 border-b border-slate-100 ${
          isVip
            ? "bg-gradient-to-r from-amber-500/10 via-amber-100/20 to-amber-500/5"
            : "bg-gradient-to-r from-emerald-500/5 via-slate-50 to-white"
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getTierBadge(
                subscription.packageTier
              )}`}
            >
              {isVip && <Sparkles className="w-3 h-3 text-amber-600" />}
              Hạng {subscription.packageTier}
            </span>

            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <span className="text-xs font-semibold text-slate-700 bg-white/90 border border-slate-200 px-2.5 py-0.5 rounded-lg shadow-2xs">
            {statusInfo.daysText}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-900 leading-tight">
          {plan?.name || "Gói tập hội viên"}
        </h3>

        {/* Dates */}
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Kích hoạt: <strong className="text-slate-700">{formatDate(subscription.startDate)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Hết hạn: <strong className="text-slate-700">{formatDate(subscription.endDate)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Sessions and Quota Progress */}
      <div className="p-6 space-y-5 flex-1">
        {/* Remaining Sessions Highlight Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Group Classes Quota */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#008b74]" />
                Lớp nhóm
              </span>
              <span className="text-xs font-bold text-slate-800">
                {totalGroup > 0 ? `${remainingGroup} / ${totalGroup} buổi` : "0 buổi"}
              </span>
            </div>

            {totalGroup > 0 ? (
              <div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1">
                  <div
                    className="bg-[#008b74] h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, (remainingGroup / totalGroup) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Đã tập: {usedGroup} buổi | Còn lại: {remainingGroup} buổi
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Không bao gồm lớp nhóm</span>
            )}
          </div>

          {/* PT Sessions Quota */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                Kèm 1:1 Coach (PT)
              </span>
              <span className="text-xs font-bold text-amber-800">
                {totalPt > 0 ? `${remainingPt} / ${totalPt} buổi` : "0 buổi"}
              </span>
            </div>

            {totalPt > 0 ? (
              <div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1">
                  <div
                    className="bg-amber-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, (remainingPt / totalPt) * 100))}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 block">
                  Đã tập: {usedPt} buổi | Còn lại: {remainingPt} buổi
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">Không bao gồm PT riêng</span>
            )}
          </div>
        </div>

        {/* Benefits & Access Policy */}
        <div className="space-y-2 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-2">
            <div
              className={`p-0.5 rounded-full ${
                subscription.hasUnlimitedGymAccess
                  ? "bg-emerald-100 text-[#008b74]"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <span>
              Quyền vào phòng Gym:{" "}
              <strong className="text-slate-800 font-semibold">
                {subscription.hasUnlimitedGymAccess
                  ? "Ra vào tự do không giới hạn số lượt"
                  : "Theo ca học và lịch lớp đã đăng ký"}
              </strong>
            </span>
          </div>

          {subscription.assignedCoach && (
            <div className="flex items-center gap-2">
              <div className="p-0.5 rounded-full bg-sky-100 text-sky-700">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <span>
                Huấn luyện viên phụ trách:{" "}
                <strong className="text-slate-800 font-semibold">
                  {subscription.assignedCoach.fullName}
                </strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs text-slate-500">
          Giá gói gốc:{" "}
          <strong className="text-slate-800">{formatCurrency(plan?.price ?? 0)}</strong>
        </div>

        <div className="flex items-center gap-2">
          {canRenew && (
            <button
              type="button"
              onClick={() => onRenew(subscription)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#008b74] hover:bg-[#007562] text-white shadow-sm shadow-[#008b74]/20 transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Gia hạn gói</span>
            </button>
          )}

          {subscription.packageTier === "VIP" && onBuyAddon && (
            <button
              type="button"
              onClick={() => onBuyAddon(subscription)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Mua thêm PT</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
