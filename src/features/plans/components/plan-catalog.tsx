import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { PageTitle } from "@/components/common/page-title";
import { StateMessage } from "@/components/feedback/state-message";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import { memberKeys } from "@/lib/keys";
import type { Discipline, Plan } from "@/lib/types";
import {
  Dumbbell,
  Flame,
  Sparkles,
  Music,
  LayoutGrid,
  Crown,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Zap,
  AlertCircle,
  X,
  Search,
  Award,
} from "lucide-react";

export interface PlanCatalogProps {
  member: boolean;
}

const TIERS = [
  { value: "", label: "Tất cả gói", tag: "Toàn bộ" },
  { value: "TRIAL", label: "Trải nghiệm", tag: "0 ₫" },
  { value: "DROP_IN", label: "Buổi lẻ", tag: "Linh hoạt" },
  { value: "PLUS", label: "Lớp nhóm", tag: "Phổ biến" },
  { value: "VIP", label: "Kèm PT 1:1", tag: "Cao cấp" },
] as const;

export interface DisciplineTheme {
  code: string;
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  tagColor: string;
  priceColor: string;
  iconColor: string;
  cardBorder: string;
  buttonBg: string;
  pillActive: string;
  accentBar: string;
}

function getDisciplineTheme(code?: string, name?: string, planName?: string): DisciplineTheme {
  const text = `${code ?? ""} ${name ?? ""} ${planName ?? ""}`.toUpperCase();

  // 1. BOXING & KICKBOXING: Solid Fiery Red
  if (text.includes("BOX") || text.includes("KICK")) {
    return {
      code: "BOXING",
      name: "Boxing & Kickboxing",
      badgeBg: "bg-rose-50",
      badgeText: "text-rose-700",
      badgeBorder: "border-rose-200",
      tagColor: "text-rose-600",
      priceColor: "text-rose-600",
      iconColor: "text-rose-500",
      cardBorder: "border-2 border-rose-200 hover:border-rose-400",
      buttonBg: "bg-rose-600 hover:bg-rose-700 text-white",
      pillActive: "bg-rose-600 text-white shadow-sm ring-1 ring-rose-600",
      accentBar: "bg-rose-500",
    };
  }

  // 2. YOGA & MEDITATION: Solid Zen Violet
  if (text.includes("YOGA") || text.includes("MEDI")) {
    return {
      code: "YOGA",
      name: "Yoga & Meditation",
      badgeBg: "bg-purple-50",
      badgeText: "text-purple-700",
      badgeBorder: "border-purple-200",
      tagColor: "text-purple-600",
      priceColor: "text-purple-700",
      iconColor: "text-purple-500",
      cardBorder: "border-2 border-purple-200 hover:border-purple-400",
      buttonBg: "bg-purple-600 hover:bg-purple-700 text-white",
      pillActive: "bg-purple-600 text-white shadow-sm ring-1 ring-purple-600",
      accentBar: "bg-purple-600",
    };
  }

  // 3. ZUMBA & MODERN DANCE: Solid Sunset Orange
  if (text.includes("DANC") || text.includes("ZUMB")) {
    return {
      code: "DANCING",
      name: "Zumba & Modern Dance",
      badgeBg: "bg-orange-50",
      badgeText: "text-orange-700",
      badgeBorder: "border-orange-200",
      tagColor: "text-orange-600",
      priceColor: "text-orange-600",
      iconColor: "text-orange-500",
      cardBorder: "border-2 border-orange-200 hover:border-orange-400",
      buttonBg: "bg-orange-600 hover:bg-orange-700 text-white",
      pillActive: "bg-orange-600 text-white shadow-sm ring-1 ring-orange-600",
      accentBar: "bg-orange-500",
    };
  }

  // 4. GYM & FITNESS (DEFAULT): Solid Emerald
  return {
    code: "GYM",
    name: "Gym & Fitness",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    tagColor: "text-emerald-700",
    priceColor: "text-[#008b74]",
    iconColor: "text-[#008b74]",
    cardBorder: "border-2 border-emerald-200 hover:border-emerald-400",
    buttonBg: "bg-[#008b74] hover:bg-[#007461] text-white",
    pillActive: "bg-[#008b74] text-white shadow-sm ring-1 ring-[#008b74]",
    accentBar: "bg-[#008b74]",
  };
}

function getDisciplineIcon(code?: string, name?: string) {
  const text = `${code ?? ""} ${name ?? ""}`.toUpperCase();
  if (text.includes("GYM") || text.includes("FITNESS")) {
    return <Dumbbell className="w-3.5 h-3.5 shrink-0" />;
  }
  if (text.includes("BOX") || text.includes("KICK")) {
    return <Flame className="w-3.5 h-3.5 shrink-0" />;
  }
  if (text.includes("YOGA") || text.includes("MEDI")) {
    return <Sparkles className="w-3.5 h-3.5 shrink-0" />;
  }
  if (text.includes("DANC") || text.includes("ZUMB")) {
    return <Music className="w-3.5 h-3.5 shrink-0" />;
  }
  return <Award className="w-3.5 h-3.5 shrink-0" />;
}

function getExtraDescription(desc?: string | null): string | null {
  if (!desc) return null;
  const cleaned = desc
    .replace(/^\s*\d+\s+group\s+classes\s*\+\s*\d+\s+PT\s+sessions\s*(\+)?\s*/i, "")
    .trim();
  if (!cleaned) return null;
  const noPlus = cleaned.replace(/^\+\s*/, "").trim();
  if (!noPlus) return null;
  if (noPlus.toLowerCase().includes("free boxing bag access")) {
    return "Miễn phí sử dụng khu vực bao cát & găng tập boxing";
  }
  return noPlus;
}

export const PlanCatalog: React.FC<PlanCatalogProps> = ({ member }) => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [disciplineId, setDisciplineId] = useState("");
  const [tier, setTier] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionError, setActionError] = useState("");

  const disciplines = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => get<Discipline[]>("/disciplines", true),
  });

  const plans = useQuery({
    queryKey: memberKeys.catalog(disciplineId, tier),
    queryFn: () =>
      get<Plan[]>(`/memberships/plans${query({ disciplineId, packageTier: tier })}`, true),
  });

  const order = useMutation({
    mutationFn: (plan: Plan) =>
      createCheckout(user!.id, { kind: "NEW_SUBSCRIPTION", planId: plan.id }),
    onSuccess: (value) => navigate(`/portal/member/checkouts/${value.checkoutId}`),
    onError: (error) => setActionError(errorText(error)),
  });

  function choose(plan: Plan) {
    if (!user || user.role !== "MEMBER") {
      navigate("/auth/login", { state: { from: "/portal/member/plans" } });
      return;
    }
    if (plan.packageTier === "VIP") {
      navigate(`/portal/member/quotations?planId=${plan.id}`);
      return;
    }
    setActionError("");
    order.mutate(plan);
  }

  const filteredPlans = useMemo(() => {
    if (!plans.data) return [];
    if (!searchQuery.trim()) return plans.data;
    const q = searchQuery.toLowerCase().trim();
    return plans.data.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.discipline?.name?.toLowerCase().includes(q) ||
        p.packageTier.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [plans.data, searchQuery]);

  const hasActiveFilters = disciplineId !== "" || tier !== "" || searchQuery.trim() !== "";

  const resetFilters = () => {
    setDisciplineId("");
    setTier("");
    setSearchQuery("");
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-16">
      {/* Hero Header */}
      <div className="relative mb-8 pb-6 border-b border-slate-200/80">
        <PageTitle
          eyebrow={member ? "MEM-02 · DANH MỤC GÓI TẬP" : "KHÁM PHÁ · BẢNG GIÁ & GÓI TẬP"}
          title="Chọn gói tập phù hợp"
        >
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-[#008b74] animate-pulse" />
            <span>{plans.data?.length ?? 0} gói tập khả dụng</span>
          </div>
        </PageTitle>

        {/* Value Trust Badges */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-5 mt-4 text-xs font-medium text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#008b74]" />
            Cam kết giá minh bạch &amp; niêm yết
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#008b74]" />
            HLV đạt chứng chỉ quốc tế
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Đo chỉ số InBody &amp; tư vấn lộ trình riêng
          </span>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm mb-8 space-y-4">
        {/* Row 1: Discipline Pill Selector with Solid Colors */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Môn tập luyện
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#008b74] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Đặt lại bộ lọc
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setDisciplineId("")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                disciplineId === ""
                  ? "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tất cả môn
            </button>
            {disciplines.data?.map((d) => {
              const isSelected = disciplineId === d.id;
              const dTheme = getDisciplineTheme(d.code, d.name);

              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDisciplineId(d.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? dTheme.pillActive
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {getDisciplineIcon(d.code, d.name)}
                  {d.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Package Tier Pill Selector with Solid Colors */}
        <div>
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Hạng gói hội viên
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {TIERS.map((t) => {
              const isSelected = tier === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTier(t.value)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? t.value === "VIP"
                        ? "bg-amber-400 text-slate-950 font-bold shadow-sm ring-1 ring-amber-400"
                        : "bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                  }`}
                >
                  {t.value === "VIP" && <Crown className="w-3.5 h-3.5 text-slate-950 shrink-0" />}
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? t.value === "VIP"
                          ? "bg-slate-950 text-amber-300"
                          : "bg-white/20 text-white"
                        : "bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {t.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 3: Direct Dropdowns & Search */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="whitespace-nowrap">Môn tập</span>
              <select
                aria-label="Môn tập"
                value={disciplineId}
                onChange={(event) => setDisciplineId(event.target.value)}
                className="h-9 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008b74]/20 focus:border-[#008b74] cursor-pointer"
              >
                <option value="">Tất cả môn</option>
                {disciplines.data?.map((discipline) => (
                  <option key={discipline.id} value={discipline.id}>
                    {discipline.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <span className="whitespace-nowrap">Loại gói</span>
              <select
                aria-label="Loại gói"
                value={tier}
                onChange={(event) => setTier(event.target.value)}
                className="h-9 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#008b74]/20 focus:border-[#008b74] cursor-pointer"
              >
                <option value="">Tất cả gói</option>
                {["TRIAL", "DROP_IN", "PLUS", "VIP"].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Quick Keyword Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh gói tập..."
              className="w-full h-9 pl-8 pr-3 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#008b74]/20 focus:border-[#008b74] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Error Notice */}
      {actionError && (
        <div
          role="alert"
          className="p-4 mb-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-in fade-in"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Query Status Feedback */}
      <StateMessage error={plans.error} onRetry={() => void plans.refetch()} />

      {/* Skeleton Loading State */}
      {plans.isPending && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm animate-pulse flex flex-col justify-between h-[420px]"
            >
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="h-6 w-28 bg-slate-200 rounded-full" />
                  <div className="h-4 w-16 bg-slate-100 rounded" />
                </div>
                <div className="h-7 w-3/4 bg-slate-200 rounded-lg mb-3" />
                <div className="h-10 w-1/2 bg-slate-200 rounded-lg mb-6" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-100 rounded" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded" />
                  <div className="h-4 w-4/6 bg-slate-100 rounded" />
                </div>
              </div>
              <div className="h-11 w-full bg-slate-200 rounded-full mt-6" />
            </div>
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {!plans.isPending && filteredPlans.length === 0 && (
        <div className="text-center py-16 px-6 bg-white rounded-2xl border border-dashed border-slate-200 max-w-lg mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#008b74] flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            Không tìm thấy gói tập phù hợp
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Hiện tại không có gói tập nào khớp với bộ lọc đã chọn. Hãy thử chọn môn tập hoặc loại gói
            khác để khám phá thêm các lựa chọn.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Xoá tất cả bộ lọc
          </button>
        </div>
      )}

      {/* Solid-Color Cards Grid - Each Discipline has its own Solid Theme */}
      {!plans.isPending && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlans.map((plan) => {
            const isVIP = plan.packageTier === "VIP";
            const isPlus = plan.packageTier === "PLUS";
            const isTrial = plan.packageTier === "TRIAL";
            const extraPerk = getExtraDescription(plan.description);
            const theme = getDisciplineTheme(plan.discipline?.code, plan.discipline?.name, plan.name);

            // Clean price string with non-breaking spaces so numbers and currency symbol NEVER break
            const formattedPrice = money(plan.price).replace(/\s+/g, "\u00A0");

            return (
              <article
                key={plan.id}
                className={`plan-card group relative rounded-2xl p-5 sm:p-6 transition-all duration-200 hover:-translate-y-1 shadow-sm hover:shadow-md flex flex-col justify-between ${
                  isVIP
                    ? "bg-slate-900 border-2 border-amber-400 text-white"
                    : `bg-white ${theme.cardBorder}`
                }`}
              >
                <div>
                  {/* Top Tier Badge & Discipline Tag */}
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    {isVIP ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-400 text-slate-950 shadow-sm shrink-0">
                        <Crown className="w-3.5 h-3.5 text-slate-950" />
                        VIP · KÈM PT 1:1
                      </span>
                    ) : isPlus ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border shadow-sm shrink-0`}
                      >
                        <Sparkles className="w-3 h-3" />
                        KHUYÊN DÙNG · PLUS
                      </span>
                    ) : isTrial ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border shadow-sm shrink-0`}
                      >
                        <Zap className="w-3 h-3" />
                        TRẢI NGHIỆM MIỄN PHÍ
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} border shadow-sm shrink-0`}
                      >
                        BUỔI LẺ LINH HOẠT
                      </span>
                    )}

                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider truncate text-right ${
                        isVIP ? "text-amber-400" : theme.tagColor
                      }`}
                    >
                      {plan.discipline?.name ?? "Bộ môn"}
                    </span>
                  </div>

                  {/* Plan Heading */}
                  <h2
                    className={`text-xl sm:text-[1.35rem] font-extrabold tracking-tight mt-1 mb-2 leading-snug ${
                      isVIP ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {plan.name}
                  </h2>

                  {/* Price Display with guaranteed NON-BREAKING format */}
                  <div
                    className={`mt-2 mb-4 pb-4 border-b ${
                      isVIP ? "border-slate-800" : "border-slate-100"
                    }`}
                  >
                    <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
                      <span
                        className={`text-2xl sm:text-[1.65rem] font-extrabold tracking-tight whitespace-nowrap inline-block ${
                          isVIP ? "text-amber-400" : theme.priceColor
                        }`}
                      >
                        {formattedPrice}
                      </span>
                      <span
                        className={`text-xs font-semibold whitespace-nowrap shrink-0 ${
                          isVIP ? "text-slate-400" : "text-slate-500"
                        }`}
                      >
                        / {plan.durationDays} ngày
                      </span>
                    </div>

                    {isVIP ? (
                      <p className="mt-1.5 text-xs text-amber-300 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>+ Phí PT theo Huấn luyện viên lựa chọn</span>
                      </p>
                    ) : isTrial ? (
                      <p
                        className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${theme.tagColor}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Miễn phí 100% · Dành cho thành viên mới</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-xs text-slate-500 font-medium">
                        Thời hạn hiệu lực {plan.durationDays} ngày từ ngày kích hoạt
                      </p>
                    )}
                  </div>

                  {/* Clean Structured Features Breakdown with Themed Solid Icons */}
                  <div className="space-y-2.5 mb-5">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isVIP ? "text-slate-400" : "text-slate-400"
                      }`}
                    >
                      Quyền lợi gói tập:
                    </p>
                    <ul className="space-y-2 text-xs">
                      {/* Duration */}
                      <li className="flex items-start gap-2.5">
                        <Clock
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isVIP ? "text-amber-400" : theme.iconColor
                          }`}
                        />
                        <span className={isVIP ? "text-slate-200" : "text-slate-700"}>
                          Thời gian: <strong>{plan.durationDays} ngày hiệu lực</strong>
                        </span>
                      </li>

                      {/* Group Classes */}
                      <li className="flex items-start gap-2.5">
                        <Users
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isVIP ? "text-amber-400" : theme.iconColor
                          }`}
                        />
                        <span className={isVIP ? "text-slate-200" : "text-slate-700"}>
                          {plan.groupSessionQuota && plan.groupSessionQuota > 0 ? (
                            <>
                              Lớp nhóm: <strong>{plan.groupSessionQuota} buổi tập</strong>
                            </>
                          ) : (
                            <span className={isVIP ? "text-slate-500" : "text-slate-400"}>
                              Không bao gồm lớp nhóm
                            </span>
                          )}
                        </span>
                      </li>

                      {/* PT 1:1 Sessions */}
                      <li className="flex items-start gap-2.5">
                        <UserCheck
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isVIP ? "text-amber-400" : theme.iconColor
                          }`}
                        />
                        <span className={isVIP ? "text-slate-200" : "text-slate-700"}>
                          {plan.ptSessionQuota && plan.ptSessionQuota > 0 ? (
                            <>
                              Kèm riêng 1:1: <strong>{plan.ptSessionQuota} buổi cùng HLV</strong>
                            </>
                          ) : (
                            <span className={isVIP ? "text-slate-500" : "text-slate-400"}>
                              Tập tự do (Không có PT kèm)
                            </span>
                          )}
                        </span>
                      </li>

                      {/* Gym Entry Check-in */}
                      <li className="flex items-start gap-2.5">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isVIP ? "text-amber-400" : theme.iconColor
                          }`}
                        />
                        <span className={isVIP ? "text-slate-200" : "text-slate-700"}>
                          {plan.unlimitedGymEntry ? (
                            <strong>Vào phòng tập tự do không giới hạn</strong>
                          ) : (
                            <span>Check-in theo lịch buổi tập đăng ký</span>
                          )}
                        </span>
                      </li>

                      {/* Highlighted Extra Perk */}
                      {extraPerk && (
                        <li
                          className={`flex items-start gap-2.5 pt-1.5 border-t border-dashed ${
                            isVIP ? "border-slate-800" : "border-slate-200"
                          }`}
                        >
                          <Sparkles
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isVIP ? "text-amber-400" : theme.iconColor
                            }`}
                          />
                          <span
                            className={`font-semibold ${
                              isVIP ? "text-amber-300" : theme.tagColor
                            }`}
                          >
                            {extraPerk}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Button-in-Button Nested Trailing CTA with Solid Colors */}
                <div className="mt-3">
                  <button
                    type="button"
                    disabled={order.isPending}
                    onClick={() => choose(plan)}
                    className={`group relative w-full inline-flex items-center justify-between pl-4 pr-1.5 py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isVIP
                        ? "bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm"
                        : `${theme.buttonBg} shadow-sm`
                    }`}
                  >
                    <span className="truncate pr-2">
                      {plan.packageTier === "VIP" ? "Chọn HLV & báo giá" : "Tiếp tục mua gói"}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:scale-105 ${
                        isVIP ? "bg-slate-950 text-amber-400" : "bg-white/20 text-white"
                      }`}
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
