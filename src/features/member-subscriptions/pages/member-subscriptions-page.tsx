import React, { useEffect, useState, useMemo } from "react";
import {
  Dumbbell,
  RefreshCw,
  Receipt,
  Sparkles,
  Layers,
  Users,
  UserCheck,
  Building2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import {
  UserSubscription,
  MembershipPlan,
} from "../types/subscriptions.types";
import {
  getMySubscriptionsApi,
  getAvailablePlansApi,
} from "../services/subscriptions-api.service";
import { SubscriptionCard } from "../components/subscription-card";
import { RenewModal } from "../components/renew-modal";
import { PurchasePlanModal } from "../components/purchase-plan-modal";
import { PlansCatalogSection } from "../components/plans-catalog-section";
import { InvoicesHistoryModal } from "../components/invoices-history-modal";

export const MemberSubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [availablePlans, setAvailablePlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [renewTarget, setRenewTarget] = useState<UserSubscription | null>(null);
  const [purchaseTarget, setPurchaseTarget] = useState<MembershipPlan | null>(null);
  const [showInvoicesModal, setShowInvoicesModal] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [subs, plans] = await Promise.all([
        getMySubscriptionsApi(),
        getAvailablePlansApi().catch(() => [] as MembershipPlan[]),
      ]);

      setSubscriptions(subs);
      setAvailablePlans(plans);
    } catch (err: unknown) {
      console.error("Failed to load subscriptions data:", err);
      setError(
        "Không thể tải danh sách gói tập hội viên. Vui lòng đảm bảo phiên đăng nhập hợp lệ và máy chủ đang hoạt động."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Summary statistics
  const stats = useMemo(() => {
    const activeSubs = subscriptions.filter((s) => s.status === "ACTIVE");
    const totalGroupRemaining = activeSubs.reduce(
      (sum, s) => sum + (s.remainingGroupSessions ?? 0),
      0
    );
    const totalPtRemaining = activeSubs.reduce(
      (sum, s) => sum + (s.remainingPtSessions ?? 0),
      0
    );
    const hasGymAccess = activeSubs.some((s) => s.hasUnlimitedGymAccess);

    return {
      activeCount: activeSubs.length,
      totalGroupRemaining,
      totalPtRemaining,
      hasGymAccess,
    };
  }, [subscriptions]);

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-16">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#008b74] to-[#005a4b] flex items-center justify-center text-white shadow-sm shadow-[#008b74]/30">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight block leading-tight">
                Dao mẻ WDP
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                Quản lý Gói tập & Quyền lợi Thẻ Hội viên
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowInvoicesModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition"
            >
              <Receipt className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Lịch sử hóa đơn</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero & Aggregate Stats */}
      <div className="bg-gradient-to-b from-white via-white to-slate-50/50 border-b border-slate-200/60 pt-10 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-[#008b74] border border-emerald-200 mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Hồ sơ Hợp đồng Hội viên</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Gói tập đang dùng & Hạn ngạch Buổi tập
            </h1>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Theo dõi chi tiết số buổi học nhóm còn lại, số buổi kèm 1:1 cùng Huấn luyện viên cá nhân, thời hạn hiệu lực của từng thẻ và chủ động gia hạn hợp đồng trực tuyến.
            </p>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1">
                Gói đang hiệu lực
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {stats.activeCount}
                </span>
                <span className="text-xs text-slate-500 font-medium">hợp đồng</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-[#008b74]" />
                Lớp nhóm còn lại
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#008b74]">
                  {stats.totalGroupRemaining}
                </span>
                <span className="text-xs text-slate-500 font-medium">buổi</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-amber-600" />
                Buổi PT Coach còn lại
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-700">
                  {stats.totalPtRemaining}
                </span>
                <span className="text-xs text-slate-500 font-medium">buổi kèm 1:1</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-sky-600" />
                Vào phòng Gym tự do
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-slate-900">
                  {stats.hasGymAccess ? "Không giới hạn" : "Theo ca lớp"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Error message */}
        {error && (
          <div className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
              >
                <div className="h-5 bg-slate-200 rounded w-1/3" />
                <div className="h-7 bg-slate-200 rounded w-2/3" />
                <div className="h-4 bg-slate-100 rounded w-full" />
                <div className="h-16 bg-slate-100 rounded mt-4" />
              </div>
            ))}
          </div>
        )}

        {/* Active Subscriptions Section */}
        {!loading && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">
                Gói tập của tôi ({subscriptions.length})
              </h2>
            </div>

            {subscriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-xl mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Bạn chưa có gói tập nào đang kích hoạt
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Khám phá danh sách các gói tập bên dưới và nhấn đăng ký để kích hoạt thẻ hội viên rèn luyện sức khỏe ngay hôm nay.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onRenew={(target) => setRenewTarget(target)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Available Plans Catalog for New Purchase */}
        {!loading && (
          <PlansCatalogSection
            plans={availablePlans}
            onSelectPlan={(plan) => setPurchaseTarget(plan)}
          />
        )}

        {/* FAQ & Policy Notes */}
        <section className="mt-14 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#008b74]" />
            <h3 className="text-base font-bold text-slate-900">
              Quy định gia hạn, cộng dồn buổi tập & chính sách Coach
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                1. Khi gia hạn gói tập, ngày hết hạn mới được tính như thế nào?
              </h4>
              <p className="leading-relaxed">
                Hệ thống tự động cộng dồn thời hạn tiếp nối ngay sau ngày hết hạn hiện tại của hợp đồng đang hoạt động, đảm bảo bạn không bị gián đoạn hay mất ngày tập nào.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                2. Số buổi tập lớp nhóm và PT chưa dùng hết có được giữ lại khi gia hạn?
              </h4>
              <p className="leading-relaxed">
                Khi thực hiện gia hạn cùng gói tập, số buổi lớp nhóm và buổi kèm 1:1 Coach còn lại sẽ được cộng dồn vào chu kỳ mới theo chính sách tích lũy của trung tâm.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                3. Tôi có thể đóng băng gói tập nếu đi công tác hoặc vì lý do sức khỏe không?
              </h4>
              <p className="leading-relaxed">
                Hội viên có quyền yêu cầu đóng băng (Frozen) gói tập tại quầy lễ tân. Trong thời gian đóng băng, chu kỳ ngày hết hạn sẽ được tạm dừng tính ngày tương ứng.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <h4 className="font-bold text-slate-800">
                4. Gói tập thử (Trial) có thể gia hạn được không?
              </h4>
              <p className="leading-relaxed">
                Gói trải nghiệm thử (Free Trial) chỉ áp dụng 1 lần duy nhất cho mỗi học viên. Để tiếp tục luyện tập, bạn có thể đăng ký gói Tiêu chuẩn (Plus) hoặc Cao cấp (VIP).
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <RenewModal
        subscription={renewTarget}
        onClose={() => setRenewTarget(null)}
        onSuccess={() => loadData()}
      />

      <PurchasePlanModal
        plan={purchaseTarget}
        onClose={() => setPurchaseTarget(null)}
        onSuccess={() => loadData()}
      />

      <InvoicesHistoryModal
        isOpen={showInvoicesModal}
        onClose={() => setShowInvoicesModal(false)}
      />
    </div>
  );
};
