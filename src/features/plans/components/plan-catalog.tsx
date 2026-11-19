import React, { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/auth/session-context";
import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { errorText, get, money, query } from "@/lib/api";
import { createCheckout } from "@/lib/checkout";
import { memberKeys } from "@/lib/keys";
import type { Discipline, Plan } from "@/lib/types";
import { getPlanImage } from "./plan-images";
import { formatPlanName, formatTierLabel } from "../lib/plan-formatter";
import { PlanDetailModal } from "./plan-detail-modal";
import { PlanCarousel } from "./plan-carousel";

import {
  Dumbbell,
  Flame,
  Sparkles,
  Music,
  Activity,
  CheckCircle2,
  Clock,
  Users,
  UserCheck,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PlanCatalogProps {
  member: boolean;
}

const defaultDisciplines: Discipline[] = [
  { id: "gym", name: "Gym & Fitness", code: "GYM" },
  { id: "boxing", name: "Boxing & Kickboxing", code: "BOXING" },
  { id: "zumba", name: "Zumba & Modern Dance", code: "DANCING" },
  { id: "yoga", name: "Yoga & Meditation", code: "YOGA" },
];

function normalizeDiscipline(str?: string): "gym" | "boxing" | "zumba" | "yoga" | "other" {
  if (!str) return "other";
  const s = str.toLowerCase();
  if (s.includes("gym") || s.includes("fitness") || s.includes("thể hình")) return "gym";
  if (s.includes("box") || s.includes("combat") || s.includes("kick") || s.includes("võ")) return "boxing";
  if (s.includes("zumba") || s.includes("dance") || s.includes("nhảy") || s.includes("dancing")) return "zumba";
  if (s.includes("yoga") || s.includes("thiền") || s.includes("meditation")) return "yoga";
  return "other";
}

function DisciplineIconComponent({ nameOrCode, className }: { nameOrCode?: string; className?: string }) {
  const norm = normalizeDiscipline(nameOrCode);
  if (norm === "gym") return <Dumbbell className={className} />;
  if (norm === "boxing") return <Flame className={className} />;
  if (norm === "zumba") return <Music className={className} />;
  if (norm === "yoga") return <Sparkles className={className} />;
  return <Activity className={className} />;
}

const DISCIPLINE_PRESETS: Record<
  "gym" | "boxing" | "zumba" | "yoga",
  { name: string; tagline: string; code: string; defaultId: string }
> = {
  gym: {
    name: "Gym & Fitness",
    tagline: "Hệ thống máy Technogym thế hệ mới, tạ tự do & khu Functional chuyên sâu",
    code: "GYM",
    defaultId: "gym",
  },
  boxing: {
    name: "Boxing & Kickboxing",
    tagline: "Võ đài tiêu chuẩn, sàn đấu đối kháng và hệ thống bao cát Contenders cao cấp",
    code: "BOXING",
    defaultId: "boxing",
  },
  zumba: {
    name: "Zumba & Modern Dance",
    tagline: "Âm nhạc bùng nổ, vũ đạo hiện đại giải phóng năng lượng cùng HLV chuyên nghiệp",
    code: "DANCING",
    defaultId: "zumba",
  },
  yoga: {
    name: "Yoga & Meditation",
    tagline: "Không gian tĩnh lặng thiền định, cân bằng thân tâm trí và phục hồi năng lượng",
    code: "YOGA",
    defaultId: "yoga",
  },
};

interface DisciplineSectionData {
  id: string;
  name: string;
  code?: string;
  tagline: string;
  plans: Plan[];
}

interface PlanCardProps {
  plan: Plan;
  onOpenDetail: (plan: Plan) => void;
  onSelectPlan: (plan: Plan, e?: React.MouseEvent) => void;
  isOrdering: boolean;
  isCurrentOrdering?: boolean;
}

const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  onOpenDetail,
  onSelectPlan,
  isOrdering,
  isCurrentOrdering = false,
}) => {
  const isVip = plan.packageTier === "VIP";
  const isPlus = plan.packageTier === "PLUS";
  const planImg = getPlanImage(
    plan.discipline?.name || plan.disciplineId,
    plan.packageTier,
    plan.name,
    plan.id
  );

  return (
    <article
      onClick={() => onOpenDetail(plan)}
      className="group relative flex flex-col justify-between bg-white rounded-md overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-emerald-600/50 transition-all duration-200 cursor-pointer w-[310px] sm:w-[350px] md:w-[370px] shrink-0 snap-start"
    >
      {/* Visual Image Header */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-950">
        <img
          src={planImg}
          alt={plan.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 filter brightness-95"
        />
        {/* Subtle Gradient Veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase bg-black/60 text-white backdrop-blur-md border border-white/20">
            <DisciplineIconComponent nameOrCode={plan.discipline?.name || plan.disciplineId} className="w-3.5 h-3.5 text-emerald-400" />
            {plan.discipline?.name || "Bộ môn"}
          </span>

          <span
            className={cn(
              "px-2.5 py-1 rounded text-[10px] font-black tracking-wider uppercase border backdrop-blur-md",
              isVip
                ? "bg-amber-500/80 text-white border-amber-400"
                : isPlus
                  ? "bg-emerald-600/80 text-white border-emerald-400"
                  : "bg-slate-700/80 text-white border-slate-500"
            )}
          >
            {formatTierLabel(plan.packageTier)}
          </span>
        </div>

        {/* Floating Action: Quick Fullscreen Trigger */}
        <div className="absolute bottom-3 right-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all">
            <Maximize2 className="w-3 h-3" />
            <span>Xem chi tiết</span>
          </span>
        </div>

        {/* Title overlay in image */}
        <div className="absolute bottom-3 left-3 max-w-[70%]">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug drop-shadow-md">
            {formatPlanName(plan.name)}
          </h2>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
        {/* Price & Duration */}
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-slate-900 font-mono tracking-tight">
              {money(plan.price)}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {plan.durationDays} ngày
            </span>
          </div>

          {isVip ? (
            <p className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-600 shrink-0" />
              <span>Chưa bao gồm phí HLV kèm riêng theo buổi</span>
            </p>
          ) : (
            <p className="text-[11px] text-slate-500">
              {plan.durationDays >= 30 ? "Thanh toán trọn gói 1 lần" : "Gói linh hoạt theo nhu cầu"}
            </p>
          )}
        </div>

        {/* Quotas Bento Chips */}
        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-md border border-slate-200/80">
          <div className="text-center">
            <Clock className="w-3.5 h-3.5 mx-auto text-emerald-600 mb-0.5" />
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Hạn dùng</span>
            <strong className="text-xs text-slate-800 font-mono">{plan.durationDays} ngày</strong>
          </div>

          <div className="text-center border-x border-slate-200/70">
            <Users className="w-3.5 h-3.5 mx-auto text-cyan-600 mb-0.5" />
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Lớp nhóm</span>
            <strong className="text-xs text-slate-800 font-mono">
              {plan.groupSessionQuota ?? 0} buổi
            </strong>
          </div>

          <div className="text-center">
            <UserCheck className="w-3.5 h-3.5 mx-auto text-amber-600 mb-0.5" />
            <span className="text-[10px] text-slate-400 block font-bold uppercase">Kèm 1:1</span>
            <strong className="text-xs text-slate-800 font-mono">
              {plan.ptSessionQuota ?? 0} buổi
            </strong>
          </div>
        </div>

        {/* Perks Summary */}
        <div className="space-y-1.5 text-xs text-slate-600">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#008b74] shrink-0" />
            <span>{plan.unlimitedGymEntry ? "Ra vào phòng tập tự do" : "Tập luyện theo ca đăng ký"}</span>
          </p>
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#008b74] shrink-0" />
            <span>Tủ đồ thông minh Smart Locker & Sauna</span>
          </p>
          {isVip && (
            <p className="flex items-center gap-2 text-amber-800 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Đặc quyền đặt lịch riêng cùng Huấn luyện viên</span>
            </p>
          )}
        </div>

        {/* Card Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="mint"
            disabled={isOrdering}
            onClick={(e) => onSelectPlan(plan, e)}
            className={cn(
              "w-full h-10 rounded-md font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer",
              isVip
                ? "bg-slate-900 hover:bg-black text-white"
                : "bg-[#008b74] hover:bg-[#007360] text-white",
              isCurrentOrdering && "opacity-80 cursor-wait"
            )}
          >
            {isCurrentOrdering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang tạo đơn hàng...</span>
              </>
            ) : (
              <>
                <span>{isVip ? "Chọn HLV & báo giá" : "Tiếp tục mua gói"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

interface DisciplinePlanSectionProps {
  section: DisciplineSectionData;
  onOpenDetail: (plan: Plan) => void;
  onSelectPlan: (plan: Plan, e?: React.MouseEvent) => void;
  isOrdering: boolean;
  orderingPlanId?: string | null;
}

const DisciplinePlanSection: React.FC<DisciplinePlanSectionProps> = ({
  section,
  onOpenDetail,
  onSelectPlan,
  isOrdering,
  orderingPlanId = null,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasOverflow = el.scrollWidth > el.clientWidth + 8;
    setCanScroll(hasOverflow);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll, section.plans]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollStep = 380; // Approximate card width + gap
    if (direction === "left") {
      if (el.scrollLeft <= 15) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -scrollStep, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: scrollStep, behavior: "smooth" });
      }
    }
  };

  return (
    <section className="space-y-4 pt-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[#008b74] flex items-center justify-center shrink-0 shadow-2xs">
            <DisciplineIconComponent nameOrCode={section.name || section.code || section.id} className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {section.name}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200/80">
                {section.plans.length} gói
              </span>
            </div>
            <p className="text-xs text-slate-500 line-clamp-1">{section.tagline}</p>
          </div>
        </div>

        {/* Top Header Navigation Arrows */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleScroll("left")}
            disabled={!canScroll}
            aria-label={`Xem gói ${section.name} trước`}
            title="Xem gói trước"
            className={cn(
              "w-8 h-8 rounded-md border flex items-center justify-center transition-all duration-200 shadow-2xs",
              canScroll
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 cursor-pointer active:scale-95"
                : "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleScroll("right")}
            disabled={!canScroll}
            aria-label={`Xem gói ${section.name} tiếp theo`}
            title="Xem gói tiếp theo"
            className={cn(
              "w-8 h-8 rounded-md border flex items-center justify-center transition-all duration-200 shadow-2xs",
              canScroll
                ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 cursor-pointer active:scale-95"
                : "bg-slate-50 border-slate-200/60 text-slate-300 cursor-not-allowed"
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row with Cards and Floating Arrows */}
      <div className="relative group/row">
        {/* Floating Left Arrow */}
        {canScroll && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            aria-label={`Cuộn trái ${section.name}`}
            className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-md bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-800 hover:bg-slate-900 hover:text-white items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Horizontally scrollable card track */}
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto scroll-smooth py-2 px-0.5 snap-x snap-mandatory items-stretch"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {section.plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onOpenDetail={onOpenDetail}
              onSelectPlan={onSelectPlan}
              isOrdering={isOrdering}
              isCurrentOrdering={orderingPlanId === plan.id}
            />
          ))}
        </div>

        {/* Floating Right Arrow */}
        {canScroll && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            aria-label={`Cuộn phải ${section.name}`}
            className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-md bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-800 hover:bg-slate-900 hover:text-white items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </section>
  );
};

export const PlanCatalog: React.FC<PlanCatalogProps> = () => {
  const { user } = useSession();
  const navigate = useNavigate();
  const [disciplineId, setDisciplineId] = useState("");
  const [tier, setTier] = useState("");
  const [actionError, setActionError] = useState("");
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<Plan | null>(null);

  const disciplines = useQuery({
    queryKey: ["disciplines"],
    queryFn: () => get<Discipline[]>("/disciplines", true),
  });

  const rawPlans = useQuery({
    queryKey: memberKeys.catalog(disciplineId, tier),
    queryFn: () =>
      get<Plan[]>(`/memberships/plans${query({ disciplineId, packageTier: tier })}`, true),
  });

  // Filter out FREE TRIAL and 0 VND plans completely as requested
  const filteredPlans = useMemo(() => {
    if (!rawPlans.data) return [];
    return rawPlans.data.filter((plan) => {
      const packageTier = (plan.packageTier || "").toUpperCase();
      const priceNum = Number(plan.price);
      const nameLower = (plan.name || "").toLowerCase();

      // Bỏ qua gói TRIAL, gói 0đ, hoặc gói dùng thử
      if (packageTier === "TRIAL") return false;
      if (isNaN(priceNum) || priceNum <= 0) return false;
      if (
        nameLower.includes("trial") ||
        nameLower.includes("thử") ||
        nameLower.includes("0đ") ||
        nameLower.includes("free")
      ) {
        return false;
      }
      return true;
    });
  }, [rawPlans.data]);

  const cache = useQueryClient();
  const [orderingPlanId, setOrderingPlanId] = useState<string | null>(null);

  const order = useMutation({
    mutationFn: (plan: Plan) =>
      createCheckout(user!.id, { kind: "NEW_SUBSCRIPTION", planId: plan.id }),
    onMutate: (plan) => {
      setOrderingPlanId(plan.id);
    },
    onSuccess: (value) => {
      cache.setQueryData(memberKeys.checkout(user!.id, value.checkoutId), value);
      navigate(`/portal/member/checkouts/${value.checkoutId}`);
    },
    onError: (error) => setActionError(errorText(error)),
    onSettled: () => {
      setOrderingPlanId(null);
    },
  });

  function choose(plan: Plan, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
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

  // Disciplines list for interactive tabs
  const tabDisciplines: Discipline[] = useMemo(() => {
    if (disciplines.data && disciplines.data.length > 0) {
      return disciplines.data;
    }
    return defaultDisciplines;
  }, [disciplines.data]);

  // Group filtered plans by discipline from top to bottom
  const disciplineSections = useMemo(() => {
    // If a specific discipline is selected in tabs, only show that discipline
    const targetDisciplines = disciplineId
      ? tabDisciplines.filter((d) => d.id === disciplineId)
      : tabDisciplines;

    const sections: DisciplineSectionData[] = [];
    const assignedPlanIds = new Set<string>();

    for (const disc of targetDisciplines) {
      const normDisc = normalizeDiscipline(disc.name || disc.code || disc.id);
      const meta = normDisc !== "other" ? DISCIPLINE_PRESETS[normDisc] : null;

      const matchingPlans = filteredPlans.filter((plan) => {
        if (assignedPlanIds.has(plan.id)) return false;

        // 1. Direct ID match
        if (plan.disciplineId === disc.id || plan.discipline?.id === disc.id) return true;

        // 2. Code match
        if (
          disc.code &&
          plan.discipline?.code &&
          disc.code.toUpperCase() === plan.discipline.code.toUpperCase()
        ) {
          return true;
        }

        // 3. Normalized discipline match
        const planNorm = normalizeDiscipline(plan.discipline?.name || plan.name);
        if (normDisc !== "other" && planNorm === normDisc) {
          return true;
        }

        return false;
      });

      if (matchingPlans.length > 0) {
        matchingPlans.forEach((p) => assignedPlanIds.add(p.id));
        sections.push({
          id: disc.id,
          name: disc.name || meta?.name || "Bộ môn",
          code: disc.code || meta?.code,
          tagline:
            meta?.tagline || "Chương trình tập luyện tiêu chuẩn quốc tế cùng trang thiết bị hiện đại",
          plans: matchingPlans,
        });
      }
    }

    // Any remaining plans that were not matched to the target disciplines
    const remainingPlans = filteredPlans.filter((p) => !assignedPlanIds.has(p.id));
    if (remainingPlans.length > 0) {
      const fallbackGroups = new Map<string, Plan[]>();
      for (const p of remainingPlans) {
        const groupName = p.discipline?.name || "Khác";
        if (!fallbackGroups.has(groupName)) {
          fallbackGroups.set(groupName, []);
        }
        fallbackGroups.get(groupName)!.push(p);
      }
      for (const [groupName, pList] of fallbackGroups.entries()) {
        sections.push({
          id: `other-${groupName}`,
          name: groupName,
          tagline: "Các gói luyện tập đặc biệt được thiết kế riêng",
          plans: pList,
        });
      }
    }

    return sections;
  }, [disciplineId, tabDisciplines, filteredPlans]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-16">
      {/* FEATURED PLANS AUTO-SLIDING CAROUSEL (outside white box) */}
      {filteredPlans.length > 0 && (
        <section className="space-y-3">
          <PlanCarousel
            plans={filteredPlans}
            onOpenDetail={setSelectedPlanForModal}
            onSelectPlan={choose}
            isOrdering={order.isPending}
          />
        </section>
      )}

      {/* WHITE CARD WRAPPER FOR LOWER CATALOG CONTENT */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm p-4 sm:p-6 md:p-8 space-y-8">
        {/* FILTER & DISCIPLINE TABS CONTROLS */}
        <section className="space-y-3">
          {/* Discipline Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setDisciplineId("")}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap border",
                !disciplineId
                  ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                  : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tất cả bộ môn</span>
            </button>

            {tabDisciplines.map((item) => {
              const isActive = disciplineId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDisciplineId(item.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap border",
                    isActive
                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <DisciplineIconComponent
                    nameOrCode={item.name || item.code || item.id}
                    className={cn("w-3.5 h-3.5", isActive ? "text-emerald-400" : "text-slate-500")}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tier Selector Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-2.5 rounded-md border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 pl-1.5">Phân hạng:</span>
              {[
                { id: "", label: "Tất cả hạng" },
                { id: "PLUS", label: "Gói Plus" },
                { id: "VIP", label: "Gói VIP (HLV 1:1)" },
                { id: "DROP_IN", label: "Vé theo buổi" },
              ].map((t) => {
                const active = tier === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTier(t.id)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs transition-all cursor-pointer font-semibold",
                      active
                        ? "bg-emerald-50 text-[#008b74] border border-emerald-300 font-bold"
                        : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-slate-500 font-medium pr-1.5">
              Hiển thị: <strong>{filteredPlans.length}</strong> gói đang kích hoạt
            </div>
          </div>
        </section>

        {/* STATE MESSAGES */}
        <StateMessage
          loading={rawPlans.isPending}
          error={rawPlans.error}
          onRetry={() => void rawPlans.refetch()}
          empty={!rawPlans.isPending && filteredPlans.length === 0}
        />

        {actionError && (
          <div className="p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="text-rose-600 hover:text-rose-900 font-bold ml-2"
            >
              Đóng
            </button>
          </div>
        )}

        {/* DISCIPLINE SECTIONS (DIVIDED FROM TOP TO BOTTOM WITH HORIZONTAL SCROLL ROWS) */}
        {disciplineSections.length > 0 && (
          <div className="space-y-10">
            {disciplineSections.map((section) => (
              <DisciplinePlanSection
                key={section.id}
                section={section}
                onOpenDetail={setSelectedPlanForModal}
                onSelectPlan={choose}
                isOrdering={order.isPending}
                orderingPlanId={orderingPlanId}
              />
            ))}
          </div>
        )}
      </div>

      {/* FULL-SCREEN IMMERSIVE PLAN DETAIL MODAL */}
      <PlanDetailModal
        plan={selectedPlanForModal}
        isOpen={Boolean(selectedPlanForModal)}
        onClose={() => setSelectedPlanForModal(null)}
        onSelectPlan={(plan) => {
          setSelectedPlanForModal(null);
          choose(plan);
        }}
        isOrdering={order.isPending}
      />
    </div>
  );
};

